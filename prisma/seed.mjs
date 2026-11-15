import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { products as seedProducts, productCategories as categories } from '../src/data/mockProducts.js';
import { services as mockServices } from '../src/data/mockServices.js';

const prisma = new PrismaClient();

const faqs = [
  { id: 'faq-1', category: 'Akun & Pendaftaran', question: 'Bagaimana cara mendaftar di FurKeeper?', answer: 'Kamu bisa mendaftar sebagai pembeli lewat halaman Daftar > Pembeli, atau sebagai mitra (penjual/jasa) lewat Daftar > Mitra.' },
  { id: 'faq-2', category: 'Belanja Produk', question: 'Bagaimana cara memesan produk?', answer: 'Pilih produk yang kamu inginkan, tambahkan ke keranjang atau beli langsung, lalu lanjutkan ke checkout dan lakukan pembayaran.' },
  { id: 'faq-3', category: 'Pemesanan Jasa', question: 'Bagaimana cara booking jasa grooming?', answer: 'Cari jasa grooming di halaman Jasa, pilih layanan dan paket, tentukan jadwal dan hewan peliharaan, lalu ajukan booking.' },
];

async function main() {
  const password = process.env.SEED_PASSWORD || 'Password123!';
  const hash = await bcrypt.hash(password, 10);

  await prisma.profiles.upsert({
    where: { email: 'admin@furkeeper.test' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@furkeeper.test',
      full_name: 'Admin FurKeeper',
      role: 'admin',
      seller_status: 'none',
      provider_status: 'none',
      password_hash: hash,
      email_verified_at: new Date(),
    },
  });

  await prisma.profiles.upsert({
    where: { email: 'budi@furkeeper.test' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      email: 'budi@furkeeper.test',
      full_name: 'Budi Santoso',
      role: 'buyer',
      seller_status: 'none',
      provider_status: 'none',
      password_hash: hash,
      email_verified_at: new Date(),
    },
  });

  await prisma.profiles.upsert({
    where: { email: 'sari@furkeeper.test' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      email: 'sari@furkeeper.test',
      full_name: 'Sari Dewi',
      role: 'buyer',
      seller_status: 'none',
      provider_status: 'none',
      password_hash: hash,
      email_verified_at: new Date(),
    },
  });

  const seller1 = await prisma.profiles.upsert({
    where: { email: 'toko1@furkeeper.test' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000004',
      email: 'toko1@furkeeper.test',
      full_name: 'Andi Wijaya',
      role: 'seller',
      seller_status: 'approved',
      provider_status: 'none',
      password_hash: hash,
      email_verified_at: new Date(),
    },
  });
  const store1 = await prisma.stores.upsert({
    where: { slug: 'pawshop-klojen' },
    update: {},
    create: {
      id: '10000000-0000-0000-0000-000000000001',
      owner_id: seller1.id,
      kind: 'seller',
      name: 'PawShop Klojen',
      slug: 'pawshop-klojen',
      tagline: 'Toko kebutuhan hewan peliharaan',
      description: 'Menyediakan makanan, aksesoris dan perlengkapan hewan peliharaan.',
      category: 'Toko Hewan',
      district: 'Klojen',
      city: 'Malang',
      is_open: true,
      trusted: true,
      fast_response: true,
      rating: 4.8,
      operating_hours: [],
    },
  });

  const seller2 = await prisma.profiles.upsert({
    where: { email: 'toko2@furkeeper.test' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000005',
      email: 'toko2@furkeeper.test',
      full_name: 'Rina Putri',
      role: 'seller',
      seller_status: 'approved',
      provider_status: 'none',
      password_hash: hash,
      email_verified_at: new Date(),
    },
  });
  await prisma.stores.upsert({
    where: { slug: 'meowmart-blimbing' },
    update: {},
    create: {
      id: '10000000-0000-0000-0000-000000000002',
      owner_id: seller2.id,
      kind: 'seller',
      name: 'MeowMart Blimbing',
      slug: 'meowmart-blimbing',
      tagline: 'Spesialis kucing dan anjing',
      description: 'Produk berkualitas untuk sahabat berbulu kesayangan.',
      category: 'Toko Hewan',
      district: 'Blimbing',
      city: 'Malang',
      is_open: true,
      trusted: false,
      fast_response: true,
      rating: 4.6,
      operating_hours: [],
    },
  });

  const provider1 = await prisma.profiles.upsert({
    where: { email: 'groom1@furkeeper.test' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000006',
      email: 'groom1@furkeeper.test',
      full_name: 'Deni Kurnia',
      role: 'service',
      seller_status: 'none',
      provider_status: 'approved',
      password_hash: hash,
      email_verified_at: new Date(),
    },
  });
  await prisma.stores.upsert({
    where: { slug: 'happy-paws-grooming' },
    update: {},
    create: {
      id: '10000000-0000-0000-0000-000000000003',
      owner_id: provider1.id,
      kind: 'service',
      name: 'Happy Paws Grooming',
      slug: 'happy-paws-grooming',
      tagline: 'Grooming & spa hewan peliharaan',
      description: 'Layanan grooming profesional dengan peralatan bersih dan aman.',
      category: 'Jasa Grooming',
      district: 'Lowokwaru',
      city: 'Malang',
      home_service: true,
      is_open: true,
      trusted: true,
      fast_response: true,
      rating: 4.9,
      operating_hours: [],
    },
  });

  for (let i = 0; i < Math.min(seedProducts.length, 5); i++) {
    const p = seedProducts[i];
    await prisma.products.upsert({
      where: { id: `p0000000-0000-0000-0000-0000000000${i + 1}` },
      update: {},
      create: {
        id: `p0000000-0000-0000-0000-0000000000${i + 1}`,
        store_id: store1.id,
        name: p.name,
        category: p.category,
        pet_type: p.petType,
        description: p.description,
        price: p.price,
        original_price: p.originalPrice || null,
        discount_percent: p.discountPercent || null,
        variants: Array.isArray(p.variants) ? p.variants : [],
        badge: p.badge || null,
        image_url: p.image,
        stock: p.stock || 50,
        rating: p.rating || 4.5,
        sold_count: p.soldCount || 10,
        is_active: true,
        approval_status: 'approved',
      },
    });
  }

  await prisma.platform_settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, commission_produk_percent: 5, commission_jasa_percent: 10 },
  });

  console.log('Seed completed');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
