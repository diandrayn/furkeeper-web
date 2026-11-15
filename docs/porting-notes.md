# Porting Notes (Tahap 1)

## a) Fungsi/trigger Postgres yang harus ditulis ulang jadi kode aplikasi

| Fungsi/Trigger | Tujuan | Input/Output | Tabel/Kolom yang disentuh | Aturan Bisnis Penting |
|---|---|---|---|---|
| `public.handle_new_user()` / trigger `on_auth_user_created` | Membuat row `profiles` saat user auth terdaftar | Trigger AFTER INSERT auth.users; mengisi profiles dari raw_user_meta_data | `auth.users` -> `profiles` (id, full_name, email, role, seller_status, provider_status, business, partner_submitted_at) | Salin status mitra dari metadata saat signup (sellerStatus/providerStatus). Di MySQL auth.users tidak ada - buat via aplikasi saat register/login. |
| `public.assign_store_slug()` / trigger `trg_assign_store_slug` | Generate slug unik untuk toko | BEFORE INSERT/UPDATE stores | `stores.slug`, `stores.name` | Jika slug kosong, buat dari nama (lowercase, replace non-alphanum dengan `-`, trim). Jika bentrok, tambahkan `-N`. |
| `public.touch_help_message_updated_at()` / trigger | Update timestamp saat help_messages diupdate | BEFORE UPDATE help_messages | `help_messages.updated_at` | Set `updated_at = now()`. |
| `public.touch_report_updated_at()` / trigger | Update timestamp saat reports diupdate | BEFORE UPDATE reports | `reports.updated_at` | Set `updated_at = now()`. |
| `public.enforce_listing_approval()` / triggers `products_enforce_approval`, `services_enforce_approval` | Enforce approval flow untuk listing | BEFORE INSERT/UPDATE products/services | `products/services` (approval_status, rejection_reason, reviewed_by, reviewed_at) | Non-admin INSERT -> pending. Admin bisa ubah status (catat reviewed_by/reviewed_at). Non-admin UPDATE setelah approved/rejected: jika kolom konten berubah (name,description,category,pet_type,price,image_url,images,service_type,price_from) -> kembali pending, reset alasan. Admin bisa reject hanya dengan alasan (constraint). |
| `public.owns_store(uuid)` | Cek apakah user pemilik toko | SQL function, returns boolean | `stores` | Digunakan untuk RLS/policy checks (MySQL tanpa RLS kompleks - enforce di aplikasi). |
| `public.is_admin()` | Cek apakah user admin | SQL function, returns boolean | `profiles` | Digunakan untuk proteksi kolom/aksi admin. |
| `public.protect_profile_privilege()` / trigger `trg_protect_profile_privilege` | Larang non-admin ubah kolom sensitif | BEFORE UPDATE profiles | `profiles` (role,is_suspended,suspended_reason,seller_status,provider_status) | Non-admin tidak boleh ubah role/suspend, tidak boleh self-approve mitra. |
| `public.search_stores(...)` RPC | Pencarian toko dengan filter/paginate | Returns jsonb {rows,total} | `stores`, `profiles`, `products`, `services` | Filter by search/name ilike, district, only_open, only_verified(trusted), has_products, has_services. Hitung product_count/service_count dari approved+active. Hanya toko owner tidak disuspend. Sort: rating desc, name asc, atau newest. |
| `public.get_store_public_stats(p_store_id uuid)` | Statistik publik toko (agregat) | Returns jsonb | `orders`, `order_items`, `bookings`, `services`, `reviews` | Hitung completed orders (distinct via order_items), completed bookings (via services), review count. Security definer, hanya agregat. |
| `public.my_withdrawal_balance(...)` / `public.store_available_balance(...)` | Hitung saldo tersedia untuk penarikan | Fungsi saldo (dari finance/withdrawal migration) | `orders`, `order_items`, `bookings`, `services`, `withdrawals`, `platform_settings` | Hitung pemasukan bersih setelah komisi, kurangi withdrawal completed/pending? Aturan bisnis perlu dicek detail dari migration terkait - implementasi di aplikasi/SQL terpisah jika dipakai. |
| `public.mark_conversation_read(...)` | Tandai pesan terbaca | Fungsi untuk menandai pesan | `messages`, `conversations` | Update is_read untuk pesan di conversation. |
| `public.delete_own_account()` | Hapus akun sendiri | SECURITY DEFINER, deletes auth.users | `auth.users` (+ cascades) | Di MySQL auth terpisah - implementasi via aplikasi dengan hapus profiles dan related data sesuai cascade. |

Catatan: Trigger/functions Postgres tidak diterjemahkan ke schema Prisma (hanya aturan bisnis dicatat). RLS policies tidak diringkas detail.

## b) Pemetaan tabel ke file `src/utils/*` dan halaman yang memakainya

| Tabel | File Utils | Halaman/View yang memakainya (contoh) |
|---|---|---|
| `profiles` | `src/utils/api.js`, `src/context/AuthContext.jsx` | Auth, Navbar, Admin pages |
| `addresses` | `src/utils/addresses.js`, `src/context/AddressContext.jsx` | Checkout, Profile/Addresses |
| `pets` | `src/context/PetContext.jsx` | Profile/Pets, Booking |
| `stores` | `src/utils/stores.js` | Toko publik, Dashboard profil, NearbySearch |
| `product_categories` | `src/utils/categories.js` (jika ada), Admin kategori | Admin/Kategori, filter produk |
| `service_categories` | `src/utils/categories.js`, Admin kategori | Admin/Kategori, filter jasa |
| `products` | `src/utils/products.js` | Katalog, Product detail, Dashboard produk |
| `services` | `src/utils/services.js` | Jasa katalog, Service detail, Dashboard jasa |
| `service_packages` | `src/utils/services.js`/bookings | Booking flow |
| `orders` | `src/utils/orders.js` | Keranjang/Checkout, Pesanan, Pembayaran, Admin transaksi |
| `order_items` | `src/utils/orders.js` | Detail pesanan |
| `order_status_history` | `src/utils/orders.js` | Tracking status |
| `bookings` | `src/utils/bookings.js` | Booking, Dashboard booking, Pembayaran |
| `booking_status_history` | `src/utils/bookings.js` | Status booking |
| `reviews` | `src/utils/reviews.js`, `src/utils/stores.js` | Ulasan, Dashboard ulasan |
| `conversations` | `src/utils/chat.js`, `src/context/ChatContext.jsx` | Chat, Dashboard chat |
| `messages` | `src/utils/chat.js`, `src/context/ChatContext.jsx` | Chat |
| `notifications` | `src/utils/notifications.js`, `src/context/NotificationContext.jsx` | Notifikasi |
| `partner_applications` | `src/utils/api.js`/partner flows | Register partner, Status pengajuan, Admin mitra |
| `withdrawals` | `src/utils/withdrawals.js`, `src/utils/admin.js` | Dashboard penarikan, Admin keuangan |
| `reports` | `src/utils/reports.js`, `src/utils/admin.js` | Lapor, Admin laporan |
| `report_messages` | `src/utils/reports.js`, `src/utils/admin.js` | Thread laporan |
| `help_messages` | `src/utils/help.js`, `src/utils/admin.js` | Bantuan/Kontak, Bantuan Saya, Admin pesan |
| `faqs` | `src/utils/faqs.js` (jika ada), Admin FAQ | Pusat bantuan |
| `platform_content` | `src/utils/platform.js`, `src/utils/admin.js` | Halaman legal, Admin pengaturan konten |
| `platform_settings` | `src/utils/admin.js` | Admin keuangan (komisi) |
| `admin_activity_log` | `src/utils/admin.js` | Admin log aktivitas |
| `password_reset_tokens`, `email_verification_tokens` | `src/utils/auth-tokens.js` (baru, untuk auth sendiri) | Reset password, Verifikasi email |
