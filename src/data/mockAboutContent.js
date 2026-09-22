/**
 * Mock About Us content.
 * Structure mirrors a typical CMS response so real HTML/Markdown can be
 * swapped in later without restructuring page components.
 */
export const mockAboutContent = {
  hero: {
    title: 'Tentang FurKeeper',
    subtitle:
      'Marketplace produk & jasa perawatan hewan peliharaan yang menghubungkan pecinta hewan dengan mitra terpercaya di seluruh Indonesia.',
  },
  story: [
    'FurKeeper lahir dari keprihatinan sederhana: menemukan produk dan jasa perawatan hewan yang berkualitas seringkali sulit, terutama di luar kota besar. Kami ingin menciptakan satu tempat di mana pemilik hewan bisa belanja, memesan grooming, vaksinasi, hingga konsultasi — dengan tenang dan terpercaya.',
    'Sejak awal, kami berfokus pada komunitas lokal. Mulai dari toko pakan di pojok jalan hingga groomer independen, FurKeeper memberi ruang bagi pelaku usaha kecil untuk tumbuh bersama, sambil memastikan setiap mitra melalui proses verifikasi yang ketat.',
  ],
  storyMid: [
    'Hari ini, FurKeeper terus berkembang menjadi jembatan antara pecinta hewan dan penyedia layanan. Setiap fitur yang kami bangun — dari pencarian terdekat hingga booking online — bertujuan membuat perawatan peliharaan Anda lebih mudah, aman, dan menyenangkan.',
  ],
  visionMission: [
    {
      id: 'visi',
      title: 'Visi',
      description:
        'Menjadi platform perawatan hewan peliharaan terpercaya nomor satu di Indonesia, yang mudah diakses oleh setiap pemilik hewan.',
      icon: 'eye',
    },
    {
      id: 'misi',
      title: 'Misi',
      description:
        'Menghubungkan pemilik hewan dengan produk dan jasa berkualitas, serta memberdayakan mitra lokal agar usaha mereka berkembang berkelanjutan.',
      icon: 'target',
    },
    {
      id: 'nilai',
      title: 'Nilai',
      description:
        'Kepercayaan, empati terhadap hewan, dan transparansi dalam setiap transaksi adalah fondasi cara kami bekerja setiap hari.',
      icon: 'heart',
    },
  ],
  contact: {
    address: 'Jl. Veteran No. 10, Malang, Jawa Timur 65145',
    email: 'hello@furkeeper.id',
    phone: '+62 812-3456-7890',
    social: [
      { id: 'instagram', label: 'Instagram', href: 'https://instagram.com/furkeeper' },
      { id: 'facebook', label: 'Facebook', href: 'https://facebook.com/furkeeper' },
      { id: 'twitter', label: 'X / Twitter', href: 'https://x.com/furkeeper' },
    ],
  },
};
