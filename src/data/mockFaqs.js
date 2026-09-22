/**
 * Mock FAQ content grouped by category.
 * Swap with CMS-fetched data later without changing Help Center components.
 */
export const FAQ_CATEGORIES = [
  { id: 'pembeli', label: 'Untuk Pembeli' },
  { id: 'penjual', label: 'Untuk Penjual' },
  { id: 'penyedia', label: 'Untuk Penyedia Jasa' },
  { id: 'pembayaran', label: 'Pembayaran' },
  { id: 'pengiriman', label: 'Pengiriman' },
];

export const mockFaqs = [
  {
    id: 'faq-1',
    category: 'pembeli',
    question: 'Bagaimana cara membuat akun pembeli di FurKeeper?',
    answer:
      'Klik tombol "Daftar" di pojok kanan atas, pilih "Daftar sebagai Pembeli", lalu isi data diri Anda. Setelah verifikasi email selesai, Anda langsung bisa belanja dan memesan jasa.',
  },
  {
    id: 'faq-2',
    category: 'pembeli',
    question: 'Apakah saya bisa memesan produk dan jasa dalam satu keranjang?',
    answer:
      'Saat ini produk dan jasa diproses terpisah. Produk masuk ke keranjang belanja, sedangkan jasa dipesan melalui halaman booking masing-masing layanan.',
  },
  {
    id: 'faq-3',
    category: 'pembeli',
    question: 'Bagaimana jika produk yang saya terima rusak atau tidak sesuai?',
    answer:
      'Anda dapat mengajukan komplain melalui halaman detail pesanan paling lambat 2×24 jam setelah barang diterima. Tim kami akan meninjau dan membantu proses pengembalian atau penggantian.',
  },
  {
    id: 'faq-4',
    category: 'penjual',
    question: 'Bagaimana cara mendaftar sebagai penjual?',
    answer:
      'Pilih "Daftar sebagai Mitra" saat registrasi, lalu lengkapi data usaha dan dokumen verifikasi. Setelah disetujui, toko Anda akan aktif dan siap menerima pesanan.',
  },
  {
    id: 'faq-5',
    category: 'penjual',
    question: 'Berapa biaya komisi yang dikenakan FurKeeper?',
    answer:
      'Komisi disesuaikan dengan kategori produk dan akan ditampilkan jelas di dashboard penjual sebelum Anda memulai. Tidak ada biaya pendaftaran di muka.',
  },
  {
    id: 'faq-6',
    category: 'penjual',
    question: 'Kapan dana penjualan dicairkan?',
    answer:
      'Dana biasanya dicairkan ke rekening terdaftar 1–3 hari kerja setelah pesanan ditandai selesai oleh pembeli, tergantung metode pembayaran yang digunakan.',
  },
  {
    id: 'faq-7',
    category: 'penyedia',
    question: 'Jenis jasa apa saja yang bisa ditawarkan?',
    answer:
      'Anda dapat menawarkan grooming, vaksinasi, penitipan, konsultasi, dan layanan perawatan hewan lainnya selama sesuai pedoman komunitas FurKeeper.',
  },
  {
    id: 'faq-8',
    category: 'penyedia',
    question: 'Bagaimana sistem booking dan konfirmasi jadwal?',
    answer:
      'Pelanggan memilih paket dan slot waktu yang tersedia. Anda menerima notifikasi, lalu dapat menerima atau menolak booking. Jadwal yang diterima akan muncul di kalender dashboard Anda.',
  },
  {
    id: 'faq-9',
    category: 'penyedia',
    question: 'Apakah saya bisa mengatur area layanan?',
    answer:
      'Ya. Di pengaturan profil mitra, Anda dapat menentukan kecamatan atau radius layanan agar hanya pelanggan di area tersebut yang dapat memesan.',
  },
  {
    id: 'faq-10',
    category: 'pembayaran',
    question: 'Metode pembayaran apa saja yang tersedia?',
    answer:
      'FurKeeper mendukung transfer bank, e-wallet, dan kartu kredit/debit. Pilihan metode ditampilkan di halaman pembayaran sebelum Anda mengonfirmasi pesanan.',
  },
  {
    id: 'faq-11',
    category: 'pembayaran',
    question: 'Bagaimana jika pembayaran gagal tetapi saldo terpotong?',
    answer:
      'Hubungi kami melalui email hello@furkeeper.id dengan lampiran bukti transaksi. Tim keuangan akan memeriksa dan memproses pengembalian jika dana memang terpotong.',
  },
  {
    id: 'faq-12',
    category: 'pembayaran',
    question: 'Apakah FurKeeper menyimpan data kartu saya?',
    answer:
      'Tidak. Pembayaran diproses melalui mitra payment gateway yang tersertifikasi. FurKeeper tidak menyimpan nomor kartu lengkap di server kami.',
  },
  {
    id: 'faq-13',
    category: 'pengiriman',
    question: 'Berapa lama waktu pengiriman produk?',
    answer:
      'Untuk area yang sama dengan toko penjual, biasanya 1–2 hari kerja. Pengiriman antar kota bergantung pada kurir yang dipilih, umumnya 2–5 hari kerja.',
  },
  {
    id: 'faq-14',
    category: 'pengiriman',
    question: 'Bisakah saya melacak status pengiriman?',
    answer:
      'Ya. Setelah pesanan dikirim, nomor resi dan status pelacakan akan muncul di halaman detail pesanan Anda.',
  },
  {
    id: 'faq-15',
    category: 'pengiriman',
    question: 'Apakah pengiriman tersedia ke seluruh Indonesia?',
    answer:
      'Sebagian besar kota besar sudah terjangkau. Ketersediaan kurir bergantung pada lokasi toko penjual; opsi pengiriman ditampilkan saat checkout.',
  },
];

export function getFaqsByCategory(categoryId) {
  return mockFaqs.filter((faq) => faq.category === categoryId);
}

export function getCategoryLabel(categoryId) {
  return FAQ_CATEGORIES.find((c) => c.id === categoryId)?.label ?? categoryId;
}
