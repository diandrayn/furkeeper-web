# T1 — Pesanan & booking keluar dari mock: single source of truth di Supabase

> **PENTING — jalankan dulu** `supabase/sync_orders_booking_migration.sql` di Supabase SQL Editor sebelum memakai alur transaksi baru. Semua perubahan status kini lewat RPC tervalidasi (stok, riwayat, dan notifikasi otomatis konsisten di pembeli/penjual/admin).

## 1. Migrasi SQL baru
- `supabase/sync_orders_booking_migration.sql`:
  - Tabel **`order_status_history`** & **`booking_status_history`** + **trigger AFTER UPDATE** (mencatat semua perubahan status, dari jalur mana pun) + policy baca (pembeli/penjual/admin).
  - **Kolom snapshot** di `orders.shipping_address` dan `bookings.buyer_name/buyer_phone/pet_name/pet_species` — penjual/penyedia tidak perlu (dan tidak punya) akses ke `addresses`/`pets`/`profiles` pembeli.
  - **RPC `submit_order` / `submit_booking`** (atomik: insert + snapshot + kurangi stok saat dibuat + notifikasi ke penjual) dan **`set_order_status` / `set_booking_status`** (validasi transisi per aktor + restore stok saat batal + notifikasi ke pihak lawan).
  - Policy RLS baru: `store owner reads orders`, `store owner replies to reviews`, baca riwayat untuk pembeli/toko/admin. Policy update langsung pembeli ke `orders`/`bookings` di-drop (status **hanya** berubah lewat RPC).
  - CHECK status diperkuat (enum persis sama dengan `src/utils/statusConstants.js`).

## 2. Lapisan data baru
- `src/utils/statusConstants.js` — **satu** enum status untuk semua role (label id/en + transisi buyer/seller & buyer/provider + `nextOrderAction`/`nextBookingAction`).
- `src/utils/orders.js`, `src/utils/bookings.js`, `src/utils/reviews.js` — `submitOrder/submitBooking`, `setOrderStatus/setBookingStatus`, `fetchMyOrders/fetchOrderById/fetchOrdersByIds/fetchStoreOrders/fetchOrderHistory`, `fetchMyBookings/fetchBookingById/fetchProviderBookings/fetchBookingHistory`, `createReview/hasReviewed/replyToReview/deleteReview`.

## 3. Halaman pembeli ditulis ulang
- **CheckoutPage** (submit order per-grup toko via RPC) → **PaymentPage** (multi-id + booking, loading/error) → **PaymentSuccessPage/FailedPage/PendingPage** (baca dari DB, `?order=&kind=`).
- **OrderStatusPage & BookingStatusPage**: data DB + realtime postgres_changes + polling 30 dtk, batal/terima via RPC, ReviewModal → `createReview`, stepper/riwayat, badge `statusLabel/statusBadge`.
- **HistoryPage**: dua tab dari DB + filter status enum + ulasan via `createReview` + `hasReviewed`.

## 4. Halaman dashboard penjual/penyedia ditulis ulang
- **DashboardOrdersPage / DashboardBookingsPage**: fetch DB + RPC `setOrderStatus/setBookingStatus` + realtime + modal aksi (Konfirmasi/Kirim/Terima/Mulai/Selesai/Batalkan).
- **DashboardReviewsPage**: ulasan DB + balasan inline (RLS store owner) + refresh.
- **DashboardOverviewPage**: KPI dari DB (`fetchStoreOrders/fetchProviderBookings/fetchStoreReviews`).
- **DashboardContext**: mock orders/bookings/reviews + `updateOrderStatus/updateBookingStatus/replyReview` **dihapus** (100% DB).

## 5. i18n
- Key baru id/en: `checkout.needAddress`; `payment.*` (loading/orderNotFound/bookingPrefix); `orderStatus.loading/cancelOrder`; `bookingStatus.loading/confirmCompletion`; `history.loading/statusAll`; `dashboardReviews.searchPlaceholder/refresh/sendReply`.

## Catatan (diketahui, ditunda)
- **Quota jasa tidak punya kolom** di tabel `bookings` → tidak dibatasi di T1 (dicatat untuk disiapkan kolom `quota` di T6/lanjutan).
- Checkout **multi-toko tidak atomik per-events**: jika stok toko B gagal, pesanan toko A sudah terlanjur dibuat (pending_payment) — pengguna bisa lanjut bayar pesanan A atau batal. Perbaikan penuh = satu RPC multi-store (rencana lanjutan).
- `set_booking_status`: notifikasi ke penyedia saat pembeli membatalkan dijaga null-safe (guard `v_provider_id is not null`), dan `v_provider_id` kini dihitung sebelum percabangan aktor.
- `HistoryContext`/`mockHistory` kini **inert** (tidak ada yang memakainya; pembeli baca DB). Dapat dihapus di pembersihan T6.
- `admin.js` `ORDER_STATUS_LABELS` label `pending_payment` = "Menunggu Pembayaran" (T3 akan distandarkan ke `statusConstants`).

---

# Halaman legal didesain ulang, beranda dirapikan jaraknya, mitra bisa ajukan pencairan dana

## 7. Halaman legal tidak lagi polos (Syarat & Ketentuan / Kebijakan Privasi / Kebijakan Pembatalan)
- **Redesign** di `LegalPage.jsx` + `LegalDocument.jsx` + komponen baru `LegalToc.jsx`:
  - Header dokumen dengan **doc switcher** (pill 3 dokumen, halaman aktif ditandai).
  - **Progress bar** tipis di tepi atas yang mengikuti kemajuan membaca.
  - **TOC sticky dengan scrollspy** di desktop (di kolom kiri), versi **collapsible di mobile**.
  - Isi dirender sebagai **kartu bagian bernomor** (nomor otomatis, judul dibersihkan dari awalan angka).
- **Konten CMS admin kini ter-struktur:** `src/utils/legalContent.js` → `parseLegalBody` memetakan `## Judul` = bagian baru, `- item` = poin berbutir, `1. item` = daftar bernomor, tanpa `##` = satu bagian fallback. Sebelumnya seluruh isi CMS diratakan jadi satu paragraf panjang.
- **Hint format** ditambahkan di editor konten `AdminSettingsPage`.
- i18n: key `legal.tocTitle`, `legal.docSwitcherLabel`, `legal.cancellationLabel` (id/en).

## 8. Jarak antar bagian beranda konsisten
- Semua section di `Home.jsx` memakai **satu skala vertikal** `py-16 md:py-20 lg:py-24`: `PetTypeSelector`, `PromoBanner` (sebelumnya tanpa padding sama sekali), `PopularCategories`, `NearbySearch`, `TrustSection`, `Testimonials`, `PartnerCTA`.
- Wrapper lama `space-y-4 py-4` yang membuat beranda sesak dihapus — tiap section kini punya ruangnya sendiri. Konten, urutan, dan warna tidak diubah.

## 10. Mitra bisa mengajukan pencairan dana (withdrawal)
- **Tab "Pencairan Dana" baru** di dashboard mitra (`/dashboard/toko/penarikan` & `/dashboard/jasa/penarikan`): kartu saldo (Saldo Tersedia / Total Penghasilan / Komisi Platform / Sudah Dicairkan), form pengajuan (jumlah + data rekening), dan riwayat pengajuan dengan badge status + alasan penolakan.
- **SQL baru `supabase/withdrawal_balance_migration.sql`** (jalankan setelah `finance_migration.sql`):
  - `store_available_balance(p_store_id)` = (pendapatan produk + jasa dari transaksi `completed`) − komisi platform (rate saat ini) − jumlah pencairan yang sudah diajukan (`pending`/`processing`/`completed`).
  - RPC `my_withdrawal_balance()` untuk dashboard (hanya toko milik pemanggil, security definer + filter `owner_id = auth.uid()`).
  - **Trigger `BEFORE INSERT`** menolak pengajuan yang melebihi saldo tersedia.
- `src/utils/finance.js` baru: `fetchMyWithdrawalBalance`, `fetchMyWithdrawals`, `requestWithdrawal`.
- `DashboardLayout` (nav + judul), `App.jsx` (rute), dan i18n `withdrawals.*` (id/en) ikut diperbarui.

## File baru
- `src/utils/legalContent.js`, `src/components/LegalToc.jsx`, `src/pages/dashboard/DashboardWithdrawalsPage.jsx`, `src/utils/finance.js`, `supabase/withdrawal_balance_migration.sql`

## File yang diubah
- `src/pages/LegalPage.jsx`, `src/components/LegalDocument.jsx`, `src/pages/admin/AdminSettingsPage.jsx`
- `src/pages/Home.jsx`, `src/sections/{PetTypeSelector,PromoBanner,PopularCategories,NearbySearch,TrustSection,Testimonials,PartnerCTA}.jsx`
- `src/App.jsx`, `src/components/dashboard/DashboardLayout.jsx`, `src/i18n/translations.js`

## Catatan manual
- **Jangan lupa jalankan** `supabase/withdrawal_balance_migration.sql` di Supabase SQL Editor (setelah `finance_migration.sql`) supaya batas saldo aktif.
- Komisi memakai rate `platform_settings` saat ini (bukan ledger per transaksi) — konsisten dengan rekap di panel admin.

---

# Akun mitra lama "tidak bisa login" — status 'none' + pemulihan dari panel admin

## Yang diperbaiki
1. **Akun mitra lama (role seller/service tapi status 'none') kini bisa dipulihkan.** Akun yang didaftarkan sebelum `admin_panel.sql` (trigger `handle_new_user` lama hanya menyalin `full_name` + `role`) terdampar: `profiles.seller_status`/`provider_status` tetap `'none'` padahal akun sudah punya toko, sehingga LoginPage menganggap "belum ada pengajuan" dan melempar pengguna ke beranda — tidak bisa login sebagai mitra sama sekali.
   - **File SQL baru `supabase/backfill_partner_status.sql`** (yang selama ini dirujuk kode tapi tidak pernah ada): idempotent, men-set `seller_status`/`provider_status` → `'approved'` + mengisi `partner_submitted_at` untuk akun yang terbukti punya toko (`stores.owner_id`, jenis toko cocok role). Akun tanpa toko tidak disentuh (biar ditinjau manual).
2. **Panel admin kini bisa melihat & menyetujui akun status 'none'.** Sebelumnya tidak ada opsi filter "Belum tercatat", dan filter "Semua" (`seller_status.neq.none,provider_status.neq.none`) justru mengeksklusi akun yang dua-duanya 'none' — jadi admin tidak mungkin memulihkan akun tersebut dari UI.
   - `AdminPartnersPage`: opsi filter `Belum tercatat` baru; kartu aplikasi kini dirender meski statusnya `'none'` (tipe dari `profiles.role`); tombol Setujui/Tolak aktif untuk status 'none'; ada hint singkat cara memulihkannya.
   - `utils/admin.js` → `fetchPartnerApplications`: filter `'none'` memakai `and(...)` (kedua status harus 'none'), bukan `or(...)` — akun normal (mis. seller approved) tidak ikut muncul di tab "Belum tercatat".
3. Baris yang dirujuk `DashboardRoute` (`supabase/backfill_partner_status.sql`) kini benar-benar ada.

## File
- BARU: `supabase/backfill_partner_status.sql`
- Diubah: `src/pages/admin/AdminPartnersPage.jsx`, `src/utils/admin.js`

## Cara mengaktifkan akun yang terdampar (salah satu)
- Jalankan `supabase/backfill_partner_status.sql` di Supabase SQL Editor (langsung memulihkan akun yang sudah punya toko), **atau**
- Login sebagai admin → `/admin/mitra` → filter **Belum tercatat** → **Setujui** akun yang dimaksud.

## Catatan manual
- Contoh kasus di DB live: `ankaarunikareswara@gmail.com` (Penyedia Jasa, punya toko "Groomer Paw") dan `Mahardika` (Penjual, tanpa toko). Registrasi mitra BARU sudah benar sejak `admin_panel.sql` diterapkan (terverifikasi: signup `service` menulis `provider_status='pending'` + `business` + `partner_submitted_at`).

---

# Login & status mitra — alur masuk yang benar

## Yang diperbaiki
1. **Partner login selalu mendarat di `/status-pengajuan`** — LoginPage dulu memakai `user_metadata` auth (status masih `pending` karena yang ditulis admin hanya tabel `profiles`), sedangkan UI mengecek `'active'`. Sekarang redirect memakai `profiles` sebagai sumber kebenaran (sudah ada di `loginWithPassword` → `fetchProfileOverrides` + `normalizeUser` yang memetakan `approved` → `active`):
   - admin → `/admin`; mitra `approved` → dashboard toko/jasa; `pending`/`rejected` → `/status-pengajuan`; pembeli → beranda (atau halaman asal).
2. **`/status-pengajuan` tidak lagi jadi tujuan semua mitra** — hanya untuk `pending`/`rejected`; mitra `approved` langsung diarahkan ke dashboard, dan akun tanpa pengajuan pulang ke `/`. Tombol "Daftar sebagai Mitra" dan "simulasi approve" sudah dihapus.
3. **Akun mitra lama yang tidak konsisten** (role seller/service tapi status `none`) tidak lagi terbawa ke `/status-pengajuan` yang hanya pantul-pantul — diarahkan ke beranda dengan penanda `partnerStatusMissing`. Diagnostik read-only di `supabase/diagnostic_partner_status.sql` untuk memeriksa/backfill kasus itu.
4. **Link "Lupa kata sandi?" mati** — route `/forgot-password` ditampilkan padahal tidak ada. → Halaman `ForgotPasswordPage` + `ResetPasswordPage` baru, dengan rute terdaftar (di luar ProtectedRoute).
   - `ForgotPasswordPage`: validasi email, `resetPasswordForEmail`, state "terkirim".
   - `ResetPasswordPage`: menerima recovery session dari link email (`detectSessionInUrl`), validasi kata sandi baru (≥6, sama), `updateUser({ password })`, dan tampilan link kedaluwarsa bila tidak ada sesi.
5. **Error login menyesatkan** — semua kegagalan ditampilkan sebagai "Email atau kata sandi salah". → `friendlyLoginError` di `utils/api.js` membedakan: email belum dikonfirmasi (status 428 → hint + tombol "Kirim ulang link konfirmasi" di LoginPage), kredensial salah (401), rate-limit (429), akun dinonaktifkan (403).

## File baru
- `src/pages/ForgotPasswordPage.jsx`
- `src/pages/ResetPasswordPage.jsx`

## File yang diubah
- `src/utils/api.js` — `friendlyLoginError`, `authApi.requestPasswordReset`, `authApi.updatePassword`.
- `src/context/AuthContext.jsx` — callback `requestPasswordReset` & `resetPassword` diekspos ke konsumen.
- `src/pages/LoginPage.jsx` — UI email-belum-dikonfirmasi + resend.
- `src/App.jsx` — rute `/forgot-password` & `/reset-password`.
- `src/i18n/translations.js` — key `auth.forgotPassword.*`, `auth.resetPassword.*`, `auth.login.emailNotConfirmedHint/resendConfirmLink/confirmLinkSent/resendFailed` (id/en).

## Lint
- File yang diubah bersih; 4 error yang muncul di `AuthContext`/`translations.js` sudah ada sebelumnya (exports `useAuth`/`AuthContext`, duplikat key `notifications`).

## Catatan manual
- Registrasi mengirim link konfirmasi email; sebelum email dikonfirmasi, login menampilkan status 428 + tombol kirim ulang (bukan lagi pesan salah kata sandi yang menyesatkan).
- Sudah ada akun pembeli/mitra lama: jika status di `profiles` memang `approved`/terisi, login → dashboard langsung. Jika tidak, lihat `supabase/diagnostic_partner_status.sql`.

---

# Chat — perbaikan end-to-end (buyer ↔ seller)

> **Sebelum dipakai, jalankan:** `supabase/chat_fix_migration.sql` di proyek Supabase yang sama (setelah `schema.sql` & `chat_and_account_upgrade.sql`). Tanpa migrasi ini: `last_message_at` tidak pernah ter-update, mark-read gagal diam-diam (tidak ada policy UPDATE di `messages`), dan Realtime hanya men-cover satu percakapan yang sedang terbuka + badge navbar tidak melihat unread milik toko.

## Akar masalah yang diperbaiki
1. **Layar chat blank** — `ChatEmptyState` memanggil `t()` yang undefined saat app pertama dirender (karena modul tidak ada provider bahasanya), dan tidak ada ErrorBoundary sehingga error itu menggelapkan seluruh app. → `t` sekarang didefinisikan via `useLanguage`, dan `ErrorBoundary` membungkus seluruh `Routes` di `App.jsx`.
2. **Tombol chat tidak muncul/salah alamat** — tombol "Chat Penjual"/"Chat Penyedia Jasa" tersembunyi untuk item demo, dan tombol Order/Booking di `OrderStatusPage`/`BookingStatusPage` cuma "+tombol segera hadir". → tombol chat sekarang selalu dirender di `ProductDetailPage`, `ServiceDetailPage`, `OrderStatusPage`, `BookingStatusPage` (nonaktif + hint `chat.demoUnavailable` untuk data demo tanpa `storeId`; aktif untuk data Supabase asli). `storeId` dialirkan lewat cart → checkout → order, dan booking → historyBooking.
3. **Mark-read & `last_message_at` gagal diam-diam** — `messages` tidak punya policy UPDATE; `conversations` tidak punya policy UPDATE untuk update `context`/`last_message_at`; klien menelepon `conversations.update()` yang diam-diam no-op. → RLS UPDATE terbaru untuk `conversations` (buyer + pemilik toko), trigger `touch_conversation_last_message`, dan RPC `mark_conversation_read(uuid)` (SECURITY DEFINER + cek partisipasi, grant ke `authenticated`).
4. **Realtime & badge unread** — sebelumnya satu subscription per percakapan yang sedang terbuka; badge mengabaikan unread toko; pesan yang masuk ke percakapan lain tidak pernah "menyalakan" badge. → satu subscription `subscribeToChat` per user (messages INSERT/UPDATE + conversations INSERT; RLS dicek ulang oleh Realtime), inbox tiap toko disimpan per `store_inbox_by_store`, `totalUnreadCount` = unread buyer + seluruh unread toko.
5. **Layout input tak terjangkau** — tinggi `ChatInboxLayout` tidak paham navbar, jadi baris input di bawah layar. → `ChatPage`/`DashboardChatPage` memakai `h-[calc(100dvh-4rem)]`, `ChatInboxLayout` `h-full min-h-0`, panel kanan `flex-1 min-w-0`.

## File baru
- `src/components/ErrorBoundary.jsx`
- `supabase/chat_fix_migration.sql`

## File yang diubah (inti)
- `src/components/ChatEmptyState.jsx` — `t` via `useLanguage`.
- `src/utils/chat.js` — `subscribeToChat` (satu feed per user), `markConversationRead` (RPC), hapus update `last_message_at` dari sisi klien + hapus `subscribeToMessages`/`markMessagesRead`.
- `src/context/ChatContext.jsx` — ditulis ulang: satu feed realtime, inbox toko per store, badge = buyer + semua toko, mark-read via RPC + refresh summary thread.
- `src/components/MessageInput.jsx` — tanpa Paperclip, `onSend` di-await, teks dipertahankan + `chat.sendFailed` saat gagal, label via `t()`.
- `src/components/ChatWindow.jsx` — hapus "Online" fiktif.
- `src/components/ChatInboxLayout.jsx` — `h-full`.
- `src/pages/ChatPage.jsx`, `src/pages/dashboard/DashboardChatPage.jsx` — tinggi mengikuti viewport (dikurangi tinggi navbar/header ~4rem).
- `src/components/Navbar.jsx` — ikon chat mitra → dashboard (`/dashboard/toko/pesan` atau `/dashboard/jasa/pesan`), buyer tetap `/chat`; badge = `totalUnreadCount`.
- `src/pages/OrderStatusPage.jsx`, `src/pages/BookingStatusPage.jsx` — tombol chat aktif: `findOrCreateConversation` → `/chat/:id`; nonaktif untuk demo.
- `src/i18n/translations.js` — `chat.messagePlaceholder`, `chat.sendLabel`, `chat.sendFailed`, `chat.demoUnavailable` (id/en).

## Lint
- Perubahan chat tidak menambah error lint baru. Sisa lint repo (71 error) semuanya pre-existing: `react-refresh/only-export-components` di file context/hook, `react-hooks/set-state-in-effect` + `react-hooks/purity` (mis. `Date.now()` saat render) di halaman yang tidak disentuh, `no-dupe-keys` `notifications` di `translations.js`, dan beberapa `no-unused-vars`.

---

# Perubahan (gabungan v2 + Keuangan + Role Admin)

## Urutan menjalankan migrasi SQL (setelah schema.sql & admin_panel.sql)
1. `activity_log_migration.sql` (sudah ada)
2. `activity_log_targets_migration.sql`  — BARU. Tanpa ini log audit untuk FAQ, konten statis, pengaturan, dan pencairan hilang diam-diam.
3. `admin_roles_migration.sql`           — BARU. Kolom `profiles.admin_scope` + trigger penjaga yang lebih ketat.
4. `finance_migration.sql`               — BARU. `platform_settings` + `withdrawals`.
5. `listing_approval_migration.sql`
6. `faq_migration.sql`
7. `platform_content_migration.sql`

## File baru di paket ini
- `src/pages/admin/AdminFinancePage.jsx` — komisi platform, rekap komisi, pencairan dana
- `src/pages/admin/AdminRolesPage.jsx` — daftar admin, ubah hak akses, tambah/cabut admin
- `src/components/admin/WithdrawalDialog.jsx`
- `src/utils/admin.js` — `target_id` untuk log komisi diubah dari `1` ke `null` (kolomnya uuid)

## Sudah dipasang ke halaman (sesi ini)
- `AdminProductsPage` / `AdminServicesPage`: tab status (Semua/Menunggu/Disetujui/Ditolak + jumlah), badge, alasan penolakan, tombol Setujui/Tolak
- `DashboardProductsPage` / `DashboardServicesPage`: penjual melihat "Menunggu" / "Ditolak" + alasan (`utils/products.js`, `utils/services.js` memetakan `approvalStatus`, `rejectionReason`)
- `fetchPublicProducts` / `fetchPublicServices`: sekarang menyaring `approval_status = 'approved'`. WAJIB menjalankan `listing_approval_migration.sql` sebelum kode ini dipakai, kalau tidak katalog publik error.
- `AdminOverviewPage`: `AdminOverviewExtras` terpasang (laporan baru, listing menunggu, ringkasan transaksi), teks "belum ditampilkan" dihapus
- `HelpCenterPage`: memakai FAQ terbit dari admin; tab kategori dibentuk dari teks kategori di data. Kalau kosong/gagal, tetap `mockFaqs`
- `Footer` (+ i18n ID/EN): link Kebijakan Pembatalan
- `LoginPage`: admin yang login tanpa tujuan khusus langsung ke `/admin`; `ProfileDropdown`: menu "Panel Admin" untuk admin

## Belum dikerjakan
- Form pengajuan pencairan dana di dashboard penjual (tabel `withdrawals` sudah siap)

## Tidak dikerjakan
- #3: pisah `stores` menjadi `toko` + `penyedia_jasa` (migrasi struktural besar)

---

# Poin 4 — User bisa membuat laporan dan memantau prosesnya

## Migrasi SQL baru (jalankan setelah reports_migration.sql)
- `reports_close_thread_migration.sql` — mengganti policy insert `report_messages` supaya reporter tidak bisa lagi membalas begitu status laporannya sudah `selesai` (sebelumnya cuma dicegah di UI, sekarang juga di RLS).

## File baru
- `src/utils/reports.js` — data layer sisi pelapor: `submitReport` (cek melaporkan toko sendiri + laporan ganda sebelum insert), `fetchMyReports`, `fetchMyReportMessages`, `sendMyReportReply`, dan `hasUnreadReportNotifications` / `markReportNotificationsRead` untuk indikator "ada balasan baru".
- `src/hooks/useUnreadReportReplies.js` — hook kecil di balik indikator itu.
- `src/components/ReportButton.jsx` — tombol "Laporkan" (bendera, tidak mencolok) + modal formnya, dipakai berulang di 4 halaman.

## Sudah dipasang ke halaman
- `ProductDetailPage` / `ServiceDetailPage`: tombol Laporkan aktif penuh — storeId/productId/serviceId-nya nyata dari Supabase (produk/jasa demo tanpa storeId tidak menampilkan tombolnya, karena memang tidak ada toko sungguhan untuk dilaporkan).
- `OrderStatusPage` / `BookingStatusPage`: tombol Laporkan sudah dipasang, tapi **lihat catatan penting di bawah** — saat ini tidak akan pernah muncul di kedua halaman ini.
- `BantuanSayaPage` tab "Laporan Saya": sebelumnya placeholder ("segera hadir"), sekarang daftar laporan asli + detail (konteks, thread `report_messages`, kolom balas yang nonaktif kalau status `selesai`).
- `ProfileDropdown` & `ProfileLayout`: titik merah kecil di menu/nav "Bantuan Saya" kalau ada notifikasi balasan/perubahan status laporan yang belum dibaca (dari tabel `notifications`, ditandai terbaca begitu tab "Laporan Saya" dibuka).
- `utils/admin.js`: `setReportStatus` dan `sendReportReply` sekarang mengirim notifikasi ke pelapor (status → diproses/selesai, dan setiap admin membalas) — polanya sama persis dengan `replyHelpMessage`. `AdminReportsPage` diupdate untuk mengirim `report.reporterId` ke keduanya.

## Catatan penting — keterbatasan yang ditemukan, bukan yang dibuat
`OrderStatusPage` dan `BookingStatusPage` ternyata sepenuhnya berbasis mock/localStorage (`HistoryContext`, `utils/orders.js`) — alur checkout dan booking tidak pernah benar-benar menulis ke tabel Supabase `orders`/`bookings`. Akibatnya data pesanan/booking di kedua halaman itu tidak punya `storeId` maupun `order_id`/`booking_id` berupa UUID asli.

`ReportButton` sengaja tidak menampilkan apa pun kalau `reportedStoreId` kosong — supaya tidak ada laporan yang terkirim dengan referensi toko palsu/salah. Karena itu, tombol Laporkan di `OrderStatusPage`/`BookingStatusPage` sudah terpasang dan siap pakai, tapi **tidak akan terlihat sampai checkout/booking benar-benar dihubungkan ke tabel `orders`/`bookings` Supabase** — begitu itu terhubung (menambahkan `storeId` nyata ke data order/booking), tombolnya langsung aktif tanpa perubahan kode lagi. Ini bukan regresi dari Poin 4 — gap ini sudah ada sebelumnya (mirip catatan yang sudah ada di `reports_migration.sql` soal tabel `reports` yang kosong karena belum ada UI-nya).

## Belum dikerjakan
- Menghubungkan `OrderStatusPage`/`BookingStatusPage` (dan alur checkout/booking di baliknya) ke tabel Supabase `orders`/`bookings` yang sesungguhnya — di luar cakupan Poin 4, tapi jadi prasyarat supaya tombol Laporkan di dua halaman itu benar-benar bisa dipakai.

