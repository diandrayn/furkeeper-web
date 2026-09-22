// Seed data for the Penjual/Penyedia Jasa dashboard. Mirrors the shape of
// the buyer-facing mock data (mockProducts, mockServices, mockHistory) but
// scoped to "my store" / "my service business" so CRUD here never mutates
// the public catalog. Everything is deterministic (no Date.now() in seeds)
// so it stays stable across renders; persistence/mutation happens in
// DashboardContext via localStorage.

export const MY_STORE_NAME = 'PawShop Klojen';
export const MY_PROVIDER_NAME = 'Grooming Happy Paws';

export const DASHBOARD_PAGE_SIZE = 8;

// ---------------------------------------------------------------------------
// Store & business profile
// ---------------------------------------------------------------------------

export const seedStoreProfile = {
  name: MY_STORE_NAME,
  category: 'Toko Perlengkapan Hewan',
  tagline: 'Perlengkapan & makanan hewan berkualitas, siap kirim se-Malang Raya.',
  description:
    'PawShop Klojen menyediakan makanan, aksesoris, dan perlengkapan perawatan untuk kucing, anjing, dan hewan kesayangan lainnya. Semua produk asli dan dikurasi langsung oleh tim kami.',
  logoUrl: null,
  bannerUrl: null,
  phone: '0812-3456-7000',
  email: 'pawshop.klojen@furkeeper.id',
  slug: 'pawshop-klojen',
  address: 'Jl. Ijen No. 21, Klojen',
  district: 'Klojen',
  city: 'Malang',
  isOpen: true,
  operatingHours: [
    { day: 'Senin - Jumat', open: '08:00', close: '20:00', closed: false },
    { day: 'Sabtu', open: '08:00', close: '21:00', closed: false },
    { day: 'Minggu', open: '09:00', close: '17:00', closed: false },
  ],
  joinedAt: Date.parse('2025-03-10T00:00:00+07:00'),
};

export const seedProviderProfile = {
  name: MY_PROVIDER_NAME,
  category: 'Grooming & Perawatan Hewan',
  tagline: 'Grooming lembut & profesional, hasil rapi setiap sesi.',
  description:
    'Grooming Happy Paws melayani mandi, potong bulu, dan grooming lengkap untuk kucing dan anjing dengan peralatan steril serta groomer berpengalaman.',
  logoUrl: null,
  bannerUrl: null,
  phone: '0813-2211-8899',
  email: 'happypaws.grooming@furkeeper.id',
  slug: 'grooming-happy-paws',
  address: 'Jl. Ijen No. 21, Klojen',
  district: 'Klojen',
  city: 'Malang',
  homeService: true,
  isOpen: true,
  operatingHours: [
    { day: 'Senin - Jumat', open: '09:00', close: '19:00', closed: false },
    { day: 'Sabtu', open: '09:00', close: '20:00', closed: false },
    { day: 'Minggu', open: '00:00', close: '00:00', closed: true },
  ],
  joinedAt: Date.parse('2025-05-02T00:00:00+07:00'),
};

// ---------------------------------------------------------------------------
// Produk (Toko)
// ---------------------------------------------------------------------------

export const productCategories = ['Makanan', 'Aksesoris', 'Perlengkapan'];
export const petTypeOptions = ['Kucing', 'Anjing', 'Hewan Lain'];

const productTemplates = [
  { name: 'Royal Canin Kitten 2kg', category: 'Makanan', petType: 'Kucing', price: 285000, stock: 24 },
  { name: 'Pet Carrier Travel Bag Premium M', category: 'Aksesoris', petType: 'Anjing', price: 350000, stock: 12 },
  { name: 'Shampoo Anti Kutu & Jamur 250ml', category: 'Perlengkapan', petType: 'Anjing', price: 75000, stock: 38 },
  { name: 'Kalung GPS Tracker Smart Collar', category: 'Aksesoris', petType: 'Kucing', price: 499000, stock: 6 },
  { name: 'Whiskas Adult Tuna 1.2kg', category: 'Makanan', petType: 'Kucing', price: 68000, stock: 45 },
  { name: 'Pasir Gumpal Bentonite Lavender 10L', category: 'Perlengkapan', petType: 'Kucing', price: 45000, stock: 60 },
  { name: 'Tempat Makan Stainless Double Bowl', category: 'Perlengkapan', petType: 'Hewan Lain', price: 89000, stock: 20 },
  { name: 'Pedigree Adult Beef 1.5kg', category: 'Makanan', petType: 'Anjing', price: 72000, stock: 30 },
  { name: 'Mainan Tikus Gigit Catnip', category: 'Aksesoris', petType: 'Kucing', price: 25000, stock: 50 },
  { name: 'Harness & Tali Tuntun Reflective', category: 'Aksesoris', petType: 'Anjing', price: 125000, stock: 15 },
  { name: 'Vitamin Kulit & Bulu 60 Tablet', category: 'Perlengkapan', petType: 'Anjing', price: 98000, stock: 22 },
  { name: 'Litter Box Tertutup Anti Bau', category: 'Perlengkapan', petType: 'Kucing', price: 165000, stock: 9 },
  { name: 'Snack Freeze Dried Ayam 100g', category: 'Makanan', petType: 'Kucing', price: 38000, stock: 0 },
  { name: 'Tempat Tidur Empuk Ukuran M', category: 'Perlengkapan', petType: 'Anjing', price: 210000, stock: 4 },
];

export function seedMyProducts() {
  return productTemplates.map((tpl, index) => {
    const sold = 40 + ((index * 53) % 480);
    const rating = Number((4.3 + ((index * 3) % 7) * 0.1).toFixed(1));
    return {
      id: `prod-${index + 1}`,
      sku: `PWK-${String(index + 1).padStart(4, '0')}`,
      name: tpl.name,
      category: tpl.category,
      petType: tpl.petType,
      price: tpl.price,
      originalPrice: index % 4 === 0 ? Math.round(tpl.price * 1.2) : null,
      stock: tpl.stock,
      status: tpl.stock === 0 ? 'habis' : index % 7 === 6 ? 'nonaktif' : 'aktif',
      sold,
      rating,
      description:
        'Deskripsi produk lengkap dapat diisi di sini — bahan, ukuran, cara pakai, dan info penting lain untuk pembeli.',
      createdAt: Date.now() - index * 3 * 86400000,
    };
  });
}

// ---------------------------------------------------------------------------
// Layanan & Paket (Jasa)
// ---------------------------------------------------------------------------

export const serviceTypeOptions = ['Mandi', 'Potong Bulu', 'Grooming Lengkap'];

const serviceTemplates = [
  { name: 'Mandi Sehat + Blow Dry Kucing', serviceType: 'Mandi', price: 85000, duration: '45 menit' },
  { name: 'Grooming & Spa Lengkap Anjing Medium', serviceType: 'Grooming Lengkap', price: 185000, duration: '90 menit' },
  { name: 'Potong Bulu Rapi Model Teddy', serviceType: 'Potong Bulu', price: 120000, duration: '60 menit' },
  { name: 'Mandi Herbal Anjing Sensitif', serviceType: 'Mandi', price: 95000, duration: '45 menit' },
  { name: 'Potong Kuku & Rapikan Telinga', serviceType: 'Potong Bulu', price: 65000, duration: '30 menit' },
  { name: 'Grooming Lengkap Anti Kutu', serviceType: 'Grooming Lengkap', price: 165000, duration: '90 menit' },
  { name: 'Mandi Kucing Bulu Panjang', serviceType: 'Mandi', price: 110000, duration: '50 menit' },
  { name: 'Paket Grooming + Vitamin Bulu', serviceType: 'Grooming Lengkap', price: 210000, duration: '100 menit' },
];

export function seedMyServices() {
  return serviceTemplates.map((tpl, index) => {
    const booked = 15 + ((index * 37) % 220);
    const rating = Number((4.4 + ((index * 5) % 6) * 0.1).toFixed(1));
    return {
      id: `svc-${index + 1}`,
      name: tpl.name,
      serviceType: tpl.serviceType,
      price: tpl.price,
      duration: tpl.duration,
      status: index % 6 === 5 ? 'nonaktif' : 'aktif',
      booked,
      rating,
      description:
        'Layanan profesional dengan peralatan steril dan produk ramah kulit. Jadwal fleksibel dan hasil rapi sesuai karakter hewan.',
      createdAt: Date.now() - index * 4 * 86400000,
    };
  });
}

// ---------------------------------------------------------------------------
// Pesanan masuk (Toko)
// ---------------------------------------------------------------------------

export const ORDER_STATUS_FLOW = ['Menunggu Konfirmasi', 'Diproses', 'Dikirim', 'Selesai'];
export const ALL_ORDER_STATUSES = [...ORDER_STATUS_FLOW, 'Dibatalkan'];

const buyerNames = [
  'Nadia Putri', 'Rizky Ardiansyah', 'Dina Wulandari', 'Bima Saputra', 'Laras Maharani',
  'Fajar Kurniawan', 'Sherly Anggraini', 'Yoga Pratama', 'Citra Ayu', 'Dimas Prasetyo',
];

export function seedMyOrders(products, count = 34) {
  const statuses = ORDER_STATUS_FLOW;
  return Array.from({ length: count }, (_, index) => {
    const product = products[index % products.length];
    const buyer = buyerNames[index % buyerNames.length];
    const qty = 1 + (index % 3);
    const status =
      index % 11 === 10 ? 'Dibatalkan' : statuses[index % statuses.length];
    return {
      id: `FK-ORD-${String(1000 + index)}`,
      buyerName: buyer,
      buyerPhone: `0812-${String(1000 + index).padStart(4, '0')}-${String(200 + index).padStart(3, '0')}`,
      productName: product.name,
      productId: product.id,
      variant: product.category === 'Makanan' ? 'Reguler' : '',
      qty,
      price: product.price,
      totalPrice: product.price * qty,
      status,
      paymentMethod: index % 3 === 0 ? 'Transfer Bank' : index % 3 === 1 ? 'QRIS' : 'COD',
      address: 'Jl. Veteran No. 10, RT 04/RW 02, Klojen, Malang',
      createdAt: Date.now() - index * 18 * 3600000,
      note: index % 5 === 0 ? 'Tolong dibungkus rapi, kado ulang tahun kucing 🐱' : '',
    };
  });
}

// ---------------------------------------------------------------------------
// Booking masuk (Jasa)
// ---------------------------------------------------------------------------

export const BOOKING_STATUS_FLOW = ['Menunggu Konfirmasi', 'Dikonfirmasi', 'Berlangsung', 'Selesai'];
export const ALL_BOOKING_STATUSES = [...BOOKING_STATUS_FLOW, 'Dibatalkan'];

const petNames = ['Mochi', 'Coco', 'Milo', 'Luna', 'Kiki', 'Oyen', 'Bobby', 'Nala'];
const petTypesForBooking = ['Kucing Domestik', 'Anjing Golden Retriever', 'Kucing Anggora', 'Anjing Poodle', 'Kucing Persia'];

export function seedMyBookings(services, count = 28) {
  const statuses = BOOKING_STATUS_FLOW;
  return Array.from({ length: count }, (_, index) => {
    const service = services[index % services.length];
    const buyer = buyerNames[(index + 3) % buyerNames.length];
    const dayOffset = (index % 10) - 3;
    const date = new Date(Date.now() + dayOffset * 86400000);
    const status =
      index % 9 === 8 ? 'Dibatalkan' : statuses[index % statuses.length];
    return {
      id: `FK-BK-${String(2000 + index)}`,
      buyerName: buyer,
      buyerPhone: `0813-${String(4000 + index).padStart(4, '0')}-${String(300 + index).padStart(3, '0')}`,
      serviceName: service.name,
      serviceId: service.id,
      price: service.price,
      status,
      date: date.toISOString().slice(0, 10),
      time: ['09:00', '10:30', '13:00', '15:00', '16:30'][index % 5],
      petName: petNames[index % petNames.length],
      petType: petTypesForBooking[index % petTypesForBooking.length],
      addressType: index % 3 === 0 ? 'Datang ke Lokasi (Home Service)' : 'Di Tempat Usaha',
      address: index % 3 === 0 ? 'Jl. Bunga Andong No. 5, Lowokwaru, Malang' : '',
      note:
        index % 4 === 0
          ? 'Hewan agak takut air, mohon ditangani pelan-pelan ya kak.'
          : '',
      createdAt: Date.now() - index * 14 * 3600000,
    };
  });
}

// ---------------------------------------------------------------------------
// Ulasan (dipakai di kedua mode)
// ---------------------------------------------------------------------------

const reviewComments = [
  'Produknya original dan pengiriman cepat, mantap!',
  'Kualitas sesuai deskripsi, penjual ramah dan responsif.',
  'Sudah langganan di sini, selalu puas.',
  'Groomer-nya sabar banget sama kucingku yang takutan.',
  'Hasil rapi dan wangi tahan lama, recommended!',
  'Tempatnya bersih, pelayanan cepat dan profesional.',
];
const reviewerNames = ['Nadia P.', 'Rizky A.', 'Dina W.', 'Bima S.', 'Laras M.', 'Fajar K.', 'Sherly A.', 'Yoga P.'];

export function seedMyReviews(itemNames, count = 12) {
  const ratingPool = [5, 5, 5, 4, 4, 3, 5, 4];
  return Array.from({ length: count }, (_, index) => ({
    id: `rev-${index + 1}`,
    reviewerName: reviewerNames[index % reviewerNames.length],
    rating: ratingPool[index % ratingPool.length],
    itemName: itemNames[index % itemNames.length],
    comment: reviewComments[index % reviewComments.length],
    createdAt: Date.now() - index * 2 * 86400000,
    reply: index % 4 === 0 ? 'Terima kasih banyak atas ulasannya! 🙏' : null,
  }));
}
