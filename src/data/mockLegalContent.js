/**
 * Draft legal copy for Terms and Privacy pages.
 * Placeholder values filled from existing FurKeeper contact data.
 * This is template content, not official legal advice — review before production.
 */

export const LEGAL_CONTACT = {
  email: 'hello@furkeeper.id',
  address: 'Jl. Veteran No. 10, Malang, Jawa Timur 65145',
};

export const termsContent = {
  slug: 'syarat-ketentuan',
  title: 'Syarat & Ketentuan',
  updatedAt: '6 September 2026',
  sections: [
    {
      id: 'pendahuluan',
      title: '1. Pendahuluan',
      paragraphs: [
        'Selamat datang di FurKeeper ("Platform", "kami"). Syarat & Ketentuan ini ("S&K") mengatur penggunaan situs web dan layanan FurKeeper oleh setiap pengguna, baik sebagai Pembeli, Penjual, maupun Penyedia Jasa ("Pengguna", "Anda"). Dengan mendaftar, mengakses, atau menggunakan Platform, Anda dianggap telah membaca, memahami, dan menyetujui seluruh isi S&K ini.',
        'FurKeeper adalah platform marketplace yang mempertemukan Pembeli dengan Penjual produk hewan peliharaan dan Penyedia Jasa perawatan/grooming hewan. FurKeeper bertindak sebagai penyedia platform (perantara teknologi) dan bukan pihak yang menjual produk atau menyediakan jasa secara langsung.',
      ],
    },
    {
      id: 'definisi',
      title: '2. Definisi',
      definitions: [
        {
          term: 'Pembeli',
          text: 'pengguna yang membeli produk dan/atau memesan (booking) jasa melalui Platform.',
        },
        {
          term: 'Penjual',
          text: 'pengguna/mitra yang mendaftarkan dan menjual produk hewan peliharaan melalui Platform.',
        },
        {
          term: 'Penyedia Jasa',
          text: 'pengguna/mitra yang mendaftarkan dan menawarkan jasa perawatan/grooming hewan melalui Platform.',
        },
        {
          term: 'Mitra',
          text: 'sebutan umum untuk Penjual dan/atau Penyedia Jasa.',
        },
        {
          term: 'Transaksi',
          text: 'proses pembelian produk atau pemesanan jasa yang dilakukan melalui Platform, termasuk pembayaran melalui payment gateway pihak ketiga (Midtrans).',
        },
        {
          term: 'Konten Pengguna',
          text: 'segala teks, gambar, ulasan, atau materi lain yang diunggah Pengguna ke Platform.',
        },
      ],
    },
    {
      id: 'pendaftaran',
      title: '3. Pendaftaran Akun',
      numbered: [
        'Setiap Pengguna wajib mendaftar menggunakan data yang benar, lengkap, dan terkini (nama, email/no. HP, dan data tambahan sesuai peran yang dipilih).',
        'Satu Pengguna dapat memiliki lebih dari satu peran pada akun yang sama (misalnya sebagai Pembeli sekaligus Penjual atau Penyedia Jasa), sesuai proses verifikasi yang berlaku untuk masing-masing peran.',
        'Pendaftaran sebagai Mitra (Penjual/Penyedia Jasa) memerlukan proses verifikasi tambahan oleh Admin FurKeeper, termasuk namun tidak terbatas pada verifikasi identitas (KTP) dan data usaha. FurKeeper berhak menolak pengajuan Mitra tanpa kewajiban menjelaskan alasan penolakan secara rinci, meskipun Admin akan berupaya memberikan alasan umum penolakan.',
        'Pengguna bertanggung jawab penuh atas kerahasiaan kata sandi akun dan seluruh aktivitas yang terjadi melalui akunnya.',
        'FurKeeper berhak menangguhkan (suspend) atau menonaktifkan permanen (banned) akun yang terbukti melanggar S&K ini, termasuk melalui mekanisme akumulasi pelanggaran sebagaimana diatur pada Pasal 8.',
      ],
    },
    {
      id: 'transaksi-produk',
      title: '4. Ketentuan Transaksi Produk',
      numbered: [
        'Penjual bertanggung jawab penuh atas keakuratan deskripsi, harga, stok, dan kualitas produk yang dipasarkan.',
        'Seluruh produk yang diunggah Penjual melalui Platform wajib melalui proses persetujuan (approval) Admin sebelum dapat ditampilkan dan dibeli oleh Pembeli.',
        'Pembayaran Transaksi diproses melalui payment gateway pihak ketiga (Midtrans). FurKeeper tidak menyimpan data kartu pembayaran Pengguna.',
        'Ongkos kirim ditentukan berdasarkan pengaturan tarif oleh masing-masing Penjual (atau tarif default Platform apabila belum diatur oleh Penjual), berdasarkan zona jarak kecamatan.',
        'Pembeli wajib mengonfirmasi penerimaan pesanan melalui Platform. Apabila dalam jangka waktu 3×24 jam sejak status "Dikirim" Pembeli tidak melakukan konfirmasi maupun pengajuan komplain, pesanan akan dianggap diterima secara otomatis oleh sistem.',
        'Komplain atas produk (rusak, tidak sesuai, salah kirim) wajib diajukan melalui fitur komplain pada Platform dalam batas waktu yang berlaku sejak status pesanan "Dikirim" atau "Selesai".',
      ],
    },
    {
      id: 'booking-jasa',
      title: '5. Ketentuan Booking Jasa',
      numbered: [
        'Penyedia Jasa bertanggung jawab penuh atas keakuratan deskripsi paket layanan, harga, estimasi durasi, dan kualitas layanan yang diberikan.',
        'Booking yang diajukan Pembeli wajib dikonfirmasi oleh Penyedia Jasa dalam jangka waktu 24 jam. Apabila tidak dikonfirmasi, booking dapat dibatalkan otomatis oleh sistem.',
        'Sebagian jasa dapat mensyaratkan uang muka (DP) yang dibayarkan di muka melalui Platform sebagai bentuk komitmen pemesanan.',
        'Pembatalan booking oleh Pembeli setelah dikonfirmasi oleh Penyedia Jasa dapat dikenakan konsekuensi berupa hangusnya sebagian atau seluruh DP, sesuai kebijakan pembatalan yang berlaku dan ditampilkan pada saat proses booking.',
        'Pembatalan sepihak oleh Penyedia Jasa tanpa alasan yang wajar dapat dikategorikan sebagai pelanggaran sebagaimana diatur pada Pasal 8.',
      ],
    },
    {
      id: 'komisi',
      title: '6. Komisi & Pembayaran kepada Mitra',
      numbered: [
        'FurKeeper mengenakan komisi atas setiap Transaksi yang berhasil diselesaikan melalui Platform, dengan besaran persentase yang dapat berbeda antara kategori produk dan jasa, sebagaimana ditampilkan pada dashboard Mitra.',
        'Dana hasil Transaksi Mitra akan ditahan sementara (saldo tertahan) selama periode tertentu untuk keperluan mitigasi risiko (misalnya menunggu konfirmasi penerimaan Pembeli), sebelum dipindahkan menjadi saldo tersedia yang dapat dicairkan.',
        'Pencairan dana dilakukan atas permintaan Mitra melalui Platform ke rekening bank yang telah didaftarkan dan diverifikasi.',
        'FurKeeper berhak menahan atau membatalkan pencairan dana apabila ditemukan indikasi kecurangan, pelanggaran S&K, atau transaksi yang sedang dalam proses sengketa/refund.',
      ],
    },
    {
      id: 'ulasan',
      title: '7. Ulasan & Konten Pengguna',
      numbered: [
        'Pembeli dapat memberikan ulasan dan rating atas produk/jasa yang telah diterima/diselesaikan, termasuk mengunggah foto sebagai bagian dari ulasan.',
        'Ulasan wajib mencerminkan pengalaman nyata dan tidak boleh mengandung ujaran kebencian, SARA, konten pornografi, atau informasi pribadi pihak lain.',
        'Mitra dilarang melakukan manipulasi ulasan, termasuk namun tidak terbatas pada membeli produk/memesan jasa milik sendiri untuk menaikkan rating, atau memberi imbalan kepada Pembeli demi ulasan positif.',
        'FurKeeper berhak menghapus ulasan yang melanggar ketentuan ini tanpa pemberitahuan sebelumnya.',
      ],
    },
    {
      id: 'pelanggaran',
      title: '8. Pelanggaran & Sanksi',
      numbered: [
        'FurKeeper menerapkan sistem pelaporan pelanggaran yang dapat diajukan oleh Pengguna terhadap Pengguna lain melalui fitur laporan pada Platform.',
        'Setiap laporan yang dinyatakan valid oleh Admin akan menambah jumlah pelanggaran pada akun terkait. Akumulasi pelanggaran hingga mencapai ambang batas 5 pelanggaran akan mengakibatkan penangguhan (suspend) akun secara otomatis.',
        'FurKeeper berhak melakukan penonaktifan permanen (banned) terhadap akun yang melakukan pelanggaran berat, termasuk namun tidak terbatas pada: penipuan, penjualan barang ilegal/berbahaya, pelecehan terhadap Pengguna lain, atau manipulasi sistem Platform, tanpa melalui mekanisme akumulasi pelanggaran bertahap.',
        'Pengguna yang merasa keberatan atas suatu keputusan sanksi dapat mengajukan banding melalui fitur Bantuan/kontak resmi FurKeeper.',
      ],
    },
    {
      id: 'batasan',
      title: '9. Batasan Tanggung Jawab',
      numbered: [
        'FurKeeper adalah penyedia platform teknologi dan bukan pihak dalam Transaksi antara Pembeli dan Mitra. FurKeeper tidak bertanggung jawab atas kualitas, keamanan, legalitas, maupun kesesuaian produk/jasa yang ditransaksikan.',
        'FurKeeper tidak bertanggung jawab atas kerugian yang timbul akibat gangguan teknis, kesalahan input data oleh Pengguna, atau kejadian di luar kendali wajar FurKeeper (force majeure).',
        'Sengketa antara Pembeli dan Mitra yang tidak dapat diselesaikan melalui fitur komplain/refund pada Platform menjadi tanggung jawab para pihak yang bersangkutan, dengan FurKeeper dapat berperan sebagai mediator sebatas kewenangan yang dimiliki.',
      ],
    },
    {
      id: 'perubahan',
      title: '10. Perubahan Syarat & Ketentuan',
      paragraphs: [
        'FurKeeper berhak mengubah, menambah, atau mengurangi isi S&K ini sewaktu-waktu. Perubahan akan diinformasikan melalui Platform dan/atau email terdaftar. Penggunaan Platform yang berkelanjutan setelah perubahan berlaku dianggap sebagai persetujuan atas S&K yang telah diperbarui.',
      ],
    },
    {
      id: 'hukum',
      title: '11. Hukum yang Berlaku',
      paragraphs: [
        'S&K ini diatur dan ditafsirkan berdasarkan hukum Negara Republik Indonesia.',
      ],
    },
    {
      id: 'kontak',
      title: '12. Kontak',
      paragraphs: [
        'Apabila terdapat pertanyaan mengenai S&K ini, silakan hubungi kami melalui:',
      ],
      bullets: [
        `Email: ${LEGAL_CONTACT.email}`,
        `Alamat: ${LEGAL_CONTACT.address}`,
      ],
    },
  ],
};

export const privacyContent = {
  slug: 'kebijakan-privasi',
  title: 'Kebijakan Privasi',
  updatedAt: '6 September 2026',
  sections: [
    {
      id: 'pendahuluan',
      title: '1. Pendahuluan',
      paragraphs: [
        'FurKeeper ("kami") berkomitmen melindungi privasi dan data pribadi Pengguna. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, menyimpan, membagikan, dan melindungi data pribadi Anda saat menggunakan Platform, sesuai dengan Undang-Undang No. 27 Tahun 2022 tentang Perlindungan Data Pribadi.',
      ],
    },
    {
      id: 'data-dikumpulkan',
      title: '2. Data yang Kami Kumpulkan',
      paragraphs: [
        'Kami dapat mengumpulkan data berikut, tergantung peran dan aktivitas Anda di Platform:',
      ],
      definitions: [
        {
          term: 'Data akun',
          text: 'nama, email, nomor HP, kata sandi (tersimpan terenkripsi), foto profil.',
        },
        {
          term: 'Data verifikasi Mitra',
          text: 'foto KTP, foto tempat usaha/produk, data rekening bank, nama & deskripsi usaha, lokasi kecamatan.',
        },
        {
          term: 'Data transaksi',
          text: 'riwayat pembelian, riwayat booking, alamat pengiriman, metode pembayaran yang digunakan (data kartu/rekening tidak disimpan oleh kami, melainkan diproses langsung oleh Midtrans selaku payment gateway).',
        },
        {
          term: 'Data hewan peliharaan',
          text: '(opsional, atas persetujuan Pembeli): nama, jenis, ras, umur, berat, catatan kesehatan/alergi — digunakan untuk mempermudah proses booking jasa.',
        },
        {
          term: 'Data penggunaan',
          text: 'log aktivitas pada Platform, riwayat chat antar Pengguna, ulasan dan rating yang diberikan.',
        },
        {
          term: 'Data teknis',
          text: 'alamat IP, jenis perangkat, browser, dan data cookie (lihat Pasal 6).',
        },
      ],
    },
    {
      id: 'tujuan',
      title: '3. Tujuan Penggunaan Data',
      paragraphs: ['Kami menggunakan data pribadi Anda untuk:'],
      numbered: [
        'Menyediakan dan mengoperasikan layanan Platform, termasuk proses pendaftaran, verifikasi Mitra, transaksi, dan booking.',
        'Memfasilitasi komunikasi antara Pembeli dan Mitra (fitur chat).',
        'Memproses pembayaran melalui payment gateway pihak ketiga (Midtrans) dan pencairan dana kepada Mitra.',
        'Menghitung dan menampilkan ongkos kirim berdasarkan lokasi kecamatan.',
        'Mengirimkan notifikasi terkait status transaksi, promosi, atau pembaruan kebijakan (Pengguna dapat mengatur preferensi notifikasi tertentu melalui pengaturan akun).',
        'Mencegah dan menangani kecurangan, pelanggaran S&K, serta menjaga keamanan Platform.',
        'Melakukan analisis internal untuk peningkatan kualitas layanan.',
      ],
    },
    {
      id: 'dasar-hukum',
      title: '4. Dasar Hukum Pemrosesan Data',
      paragraphs: [
        'Kami memproses data pribadi Anda berdasarkan: (a) persetujuan yang Anda berikan saat mendaftar dan menggunakan Platform, (b) kebutuhan pelaksanaan kontrak/transaksi antara Anda dan Platform, dan (c) kepentingan sah kami dalam menjaga keamanan dan operasional Platform.',
      ],
    },
    {
      id: 'pihak-ketiga',
      title: '5. Pembagian Data kepada Pihak Ketiga',
      paragraphs: ['Kami dapat membagikan data pribadi Anda kepada:'],
      definitions: [
        {
          term: 'Midtrans',
          text: '(payment gateway) — untuk memproses pembayaran Transaksi. Midtrans memiliki kebijakan privasi tersendiri yang berlaku atas data pembayaran Anda.',
        },
        {
          term: 'Mitra kurir/logistik',
          text: 'sebatas data alamat dan kontak yang diperlukan untuk pengiriman produk.',
        },
        {
          term: 'Penjual/Penyedia Jasa terkait',
          text: 'sebatas data yang diperlukan untuk menyelesaikan Transaksi (nama, alamat, nomor kontak Pembeli untuk keperluan pengiriman/booking).',
        },
        {
          term: 'Otoritas berwenang',
          text: 'apabila diwajibkan oleh hukum yang berlaku, termasuk dalam rangka penegakan hukum atau permintaan resmi dari lembaga pemerintah.',
        },
      ],
      paragraphsAfter: [
        'Kami tidak menjual data pribadi Anda kepada pihak ketiga untuk kepentingan pemasaran tanpa persetujuan Anda.',
      ],
    },
    {
      id: 'cookies',
      title: '6. Cookies',
      paragraphs: [
        'Platform menggunakan cookies dan teknologi serupa untuk menjaga sesi login, mengingat preferensi Anda, dan menganalisis penggunaan Platform. Anda dapat mengatur browser untuk menolak cookies, namun hal ini dapat memengaruhi fungsi tertentu pada Platform.',
      ],
    },
    {
      id: 'keamanan',
      title: '7. Keamanan Data',
      paragraphs: [
        'Kami menerapkan langkah-langkah teknis dan organisatoris yang wajar untuk melindungi data pribadi Anda dari akses tidak sah, kebocoran, perubahan, atau pemusnahan data, termasuk enkripsi kata sandi dan pembatasan akses internal berbasis peran (role-based access) pada tim Admin kami.',
      ],
    },
    {
      id: 'retensi',
      title: '8. Penyimpanan & Retensi Data',
      paragraphs: [
        'Data pribadi Anda akan disimpan selama akun Anda aktif dan/atau selama diperlukan untuk memenuhi tujuan sebagaimana dijelaskan dalam kebijakan ini, termasuk kewajiban hukum yang berlaku (misalnya kewajiban pencatatan transaksi keuangan).',
      ],
    },
    {
      id: 'hak',
      title: '9. Hak Anda sebagai Pemilik Data',
      paragraphs: ['Sesuai UU PDP, Anda memiliki hak untuk:'],
      numbered: [
        'Mengakses dan memperoleh salinan data pribadi Anda yang kami simpan.',
        'Memperbarui atau mengoreksi data pribadi yang tidak akurat.',
        'Menghapus data pribadi Anda (right to erasure), dengan ketentuan penghapusan tidak berlaku atas data yang wajib disimpan untuk kepentingan hukum/keuangan.',
        'Menarik persetujuan atas pemrosesan data tertentu.',
        'Mengajukan keberatan atas pemrosesan data untuk tujuan pemasaran langsung.',
      ],
      paragraphsAfter: [
        'Permintaan terkait hak-hak di atas dapat diajukan melalui kontak pada Pasal 11.',
      ],
    },
    {
      id: 'perubahan',
      title: '10. Perubahan Kebijakan Privasi',
      paragraphs: [
        'Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Perubahan material akan diinformasikan melalui Platform dan/atau email terdaftar sebelum berlaku efektif.',
      ],
    },
    {
      id: 'kontak',
      title: '11. Kontak',
      paragraphs: [
        'Untuk pertanyaan, keluhan, atau permintaan terkait data pribadi Anda, silakan hubungi:',
      ],
      bullets: [
        `Email: ${LEGAL_CONTACT.email}`,
        `Alamat: ${LEGAL_CONTACT.address}`,
      ],
    },
  ],
};
