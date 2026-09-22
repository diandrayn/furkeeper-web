export const PRODUCT_PAGE_SIZE = 12;

export const productCategories = ['Makanan', 'Aksesoris', 'Perlengkapan'];
export const petTypeFilters = ['Kucing', 'Anjing', 'Hewan Lain'];

const stores = [
  { storeName: 'PawShop Klojen', storeLocation: 'Klojen', storeRating: 4.8, storeTrusted: true },
  { storeName: 'PetCare Malang', storeLocation: 'Lowokwaru', storeRating: 4.7, storeTrusted: true },
  { storeName: 'Meow Mart', storeLocation: 'Blimbing', storeRating: 4.6, storeTrusted: false },
  { storeName: 'Happy Paws Store', storeLocation: 'Sukun', storeRating: 4.9, storeTrusted: true },
  { storeName: 'Anabul Corner', storeLocation: 'Kedungkandang', storeRating: 4.5, storeTrusted: false },
];

const templates = [
  {
    name: 'Royal Canin Kitten 2kg — Makanan Kucing Anak',
    category: 'Makanan',
    petType: 'Kucing',
    price: 285000,
    originalPrice: 356000,
    variants: ['500g', '1kg', '2kg'],
    badge: 'Terlaris',
  },
  {
    name: 'Pet Carrier Travel Bag Premium Medium Size',
    category: 'Aksesoris',
    petType: 'Anjing',
    price: 350000,
    originalPrice: null,
    variants: ['S', 'M', 'L'],
    badge: 'Baru',
  },
  {
    name: 'Shampoo Anti Kutu & Jamur untuk Anjing & Kucing',
    category: 'Perlengkapan',
    petType: 'Anjing',
    price: 75000,
    originalPrice: 95000,
    variants: [],
    badge: 'Terlaris',
  },
  {
    name: 'Kalung GPS Tracker Smart Collar untuk Hewan',
    category: 'Aksesoris',
    petType: 'Kucing',
    price: 499000,
    originalPrice: null,
    variants: ['Hitam', 'Merah', 'Biru'],
    badge: 'Baru',
  },
  {
    name: 'Whiskas Adult Tuna 1.2kg — Makanan Kucing Dewasa',
    category: 'Makanan',
    petType: 'Kucing',
    price: 68000,
    originalPrice: 85000,
    variants: ['480g', '1.2kg', '3kg'],
    badge: null,
  },
  {
    name: 'Pasir Gumpal Bentonite Wangi Lavender 10L',
    category: 'Perlengkapan',
    petType: 'Kucing',
    price: 45000,
    originalPrice: null,
    variants: ['5L', '10L', '20L'],
    badge: 'Terlaris',
  },
  {
    name: 'Tempat Makan Stainless Double Bowl Anti Semut',
    category: 'Perlengkapan',
    petType: 'Hewan Lain',
    price: 89000,
    originalPrice: 120000,
    variants: [],
    badge: null,
  },
  {
    name: 'Pedigree Adult Beef 1.5kg — Makanan Anjing',
    category: 'Makanan',
    petType: 'Anjing',
    price: 72000,
    originalPrice: 90000,
    variants: ['1.5kg', '3kg', '8kg'],
    badge: null,
  },
  {
    name: 'Mainan Tikus Gigit Kucing dengan Catnip',
    category: 'Aksesoris',
    petType: 'Kucing',
    price: 25000,
    originalPrice: null,
    variants: [],
    badge: 'Baru',
  },
  {
    name: 'Kandang Kelinci Indoor Lipat Ukuran Sedang',
    category: 'Perlengkapan',
    petType: 'Hewan Lain',
    price: 245000,
    originalPrice: 310000,
    variants: ['S', 'M'],
    badge: null,
  },
  {
    name: 'Harness & Tali Tuntun Anjing Reflective',
    category: 'Aksesoris',
    petType: 'Anjing',
    price: 125000,
    originalPrice: 155000,
    variants: ['S', 'M', 'L', 'XL'],
    badge: 'Terlaris',
  },
  {
    name: 'Vitamin Kulit & Bulu Anjing-Kucing 60 Tablet',
    category: 'Perlengkapan',
    petType: 'Anjing',
    price: 98000,
    originalPrice: null,
    variants: [],
    badge: null,
  },
];

const descriptions = [
  'Formulasi nutrisi lengkap untuk mendukung pertumbuhan sehat. Tekstur renyah disukai peliharaan, dengan bahan berkualitas dan kemasan kedap udara.',
  'Dirancang nyaman dipakai sehari-hari. Jahitan rapi, bahan tahan lama, dan mudah dibersihkan setelah dipakai di rumah maupun saat bepergian.',
  'Membantu merawat kulit dan bulu agar tetap bersih dan wangi. Cocok untuk pemakaian rutin sesuai petunjuk pada kemasan.',
];

function buildProducts(count = 84) {
  return Array.from({ length: count }, (_, index) => {
    const template = templates[index % templates.length];
    const store = stores[index % stores.length];
    const cycle = Math.floor(index / templates.length);
    const priceOffset = cycle * 5000;
    const price = template.price + priceOffset;
    const originalPrice = template.originalPrice
      ? template.originalPrice + priceOffset
      : null;
    const discountPercent =
      originalPrice != null
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : null;
    const rating = Number((4.3 + (index % 7) * 0.1).toFixed(1));
    const soldCount = 80 + ((index * 137) % 4200);
    const reviewCount = 12 + ((index * 17) % 340);
    const name =
      cycle === 0 ? template.name : `${template.name} — Varian ${cycle + 1}`;

    return {
      id: index + 1,
      name,
      storeName: store.storeName,
      storeLocation: store.storeLocation,
      storeRating: store.storeRating,
      storeTrusted: store.storeTrusted,
      price,
      originalPrice,
      discountPercent,
      rating,
      soldCount,
      reviewCount,
      badge: cycle === 0 ? template.badge : index % 9 === 0 ? 'Baru' : null,
      category: template.category,
      petType: template.petType,
      location: store.storeLocation,
      variants: template.variants,
      stock: 8 + (index % 40),
      imageCount: 4,
      createdAt: Date.now() - index * 86400000,
      description: descriptions[index % descriptions.length],
    };
  });
}

export const products = buildProducts(84);

export function getProductById(id) {
  return products.find((item) => String(item.id) === String(id)) ?? null;
}

export function getRelatedProducts(product, limit = 8) {
  if (!product) return products.slice(0, limit);
  return products
    .filter((item) => item.id !== product.id)
    .filter((item) => item.category === product.category || item.petType === product.petType)
    .slice(0, limit);
}
