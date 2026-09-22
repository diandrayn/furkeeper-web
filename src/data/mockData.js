import kucingImg from '../assets/pets/kucing.jpg';
import anjingImg from '../assets/pets/anjing.jpg';
import lainnyaImg from '../assets/pets/lainnya.jpg';

export const navLinks = [
  { label: 'Beranda', href: '/' },
  { label: 'Produk', href: '/produk' },
  { label: 'Jasa', href: '/jasa' },
  { label: 'Tentang Kami', href: '/tentang-kami' },
  { label: 'Bantuan', href: '/bantuan' },
];

// Foto di card "Pilih Jenis Hewan" — src/assets/pets/kucing.png, anjing.png,
// lainnya.png (siluet buatan sendiri, background transparan).
export const petTypes = [
  {
    id: 'kucing',
    label: 'Kucing',
    ringColor: 'ring-teal-300',
    image: kucingImg,
    alt: 'Foto kucing peliharaan',
  },
  {
    id: 'anjing',
    label: 'Anjing',
    ringColor: 'ring-orange-200',
    image: anjingImg,
    alt: 'Foto anjing peliharaan',
  },
  {
    id: 'lainnya',
    label: 'Hewan Lain',
    ringColor: 'ring-green-200',
    image: lainnyaImg,
    alt: 'Foto hewan peliharaan lainnya',
  },
];

export { products } from './mockProducts';
export { services } from './mockServices';

export const districts = [
  'Klojen',
  'Blimbing',
  'Lowokwaru',
  'Sukun',
  'Kedungkandang',
];

export const testimonials = [
  {
    id: 1,
    initials: 'NP',
    name: 'Nadia P.',
    role: 'Pemilik Kucing',
    avatarBg: 'bg-teal-400',
    rating: 5,
    quote:
      'Belanja makanan kucing jadi gampang banget! Pengiriman cepat dan produknya original. Kucingku suka banget Royal Canin dari sini.',
  },
  {
    id: 2,
    initials: 'RA',
    name: 'Rizky A.',
    role: 'Pemilik Anjing',
    avatarBg: 'bg-orange-300',
    rating: 5,
    quote:
      'Grooming service-nya top! Anjingku balik bersih dan wangi. Penjualnya juga ramah dan profesional. Pasti order lagi!',
  },
  {
    id: 3,
    initials: 'DW',
    name: 'Dina W.',
    role: 'Pemilik Kelinci',
    avatarBg: 'bg-yellow-300',
    rating: 5,
    quote:
      'FurKeeper punya banyak pilihan untuk hewan selain kucing & anjing. Akhirnya nemu toko yang jual pakan kelinci berkualitas!',
  },
];

export const trustPoints = [
  {
    id: 1,
    title: 'Mitra Terverifikasi',
    description: 'Setiap penjual & penyedia jasa melalui proses verifikasi sebelum bergabung di FurKeeper.',
  },
  {
    id: 2,
    title: 'Pembayaran Aman',
    description: 'Transaksi Anda dilindungi sistem escrow dan metode pembayaran terpercaya.',
  },
  {
    id: 3,
    title: 'Dukungan Pelanggan 24/7',
    description: 'Tim kami siap membantu kapan saja lewat chat, email, atau telepon.',
  },
];

export const sellerCategories = [
  'Makanan Hewan',
  'Aksesoris',
  'Perlengkapan',
  'Lainnya',
];

export const serviceCategories = [
  'Mandi',
  'Potong Bulu',
  'Grooming Lengkap',
  'Lainnya',
];

export const banks = ['BCA', 'BNI', 'Mandiri', 'BRI', 'CIMB Niaga', 'Permata'];
