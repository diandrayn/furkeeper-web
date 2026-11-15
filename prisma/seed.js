import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { seedProducts, categories } from '../src/data/mockProducts.js';
import { services as mockServices } from '../src/data/mockServices.js';
import { faqs } from '../src/data/mockFaqs.js';

const prisma = new PrismaClient();

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
  const store2 = await prisma.stores.upsert({
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
  const svcStore1 = await prisma.stores.upsert({
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

  const provider2 = await prisma.profiles.upsert({
    where: { email: 'groom2@furkeeper.test' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000007',
      email: 'groom2@furkeeper.test',
      full_name: 'Maya Lestari',
      role: 'service',
      seller_status: 'none',
      provider_status: 'approved',
      password_hash: hash,
      email_verified_at: new Date(),
    },
  });
  await prisma.stores.upsert({
    where: { slug: 'furry-care-service' },
    update: {},
    create: {
      id: '10000000-0000-0000-0000-000000000004',
      owner_id: provider2.id,
      kind: 'service',
      name: 'Furry Care Service',
      slug: 'furry-care-service',
      tagline: 'Perawatan lengkap untuk hewan kesayangan',
      description: 'Mandi, potong bulu, grooming lengkap dengan tenaga berpengalaman.',
      category: 'Jasa Grooming',
      district: 'Kedungkandang',
      city: 'Malang',
      home_service: false,
      is_open: true,
      trusted: false,
      fast_response: false,
      rating: 4.7,
      operating_hours: [],
    },
  });

  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    await prisma.product_categories.upsert({
      where: { id: `c0000000-0000-0000-0000-00000000000${i + 1}` },
      update: {},
      create: {
        id: `c0000000-0000-0000-0000-00000000000${i + 1}`,
        name: cat,
        sort_order: i,
      },
    });
  }

  const svcCats = ['Mandi', 'Potong Bulu', 'Grooming Lengkap', 'Perawatan Kuku', 'Spa Hewan'];
  for (let i = 0; i < svcCats.length; i++) {
    await prisma.service_categories.upsert({
      where: { id: `d0000000-0000-0000-0000-00000000000${i + 1}` },
      update: {},
      create: {
        id: `d0000000-0000-0000-0000-00000000000${i + 1}`,
        name: svcCats[i],
        sort_order: i,
      },
    });
  }

  for (let i = 0; i < Math.min(seedProducts.length, 10); i++) {
    const p = seedProducts[i];
    await prisma.products.upsert({
      where: { id: `p0000000-0000-0000-0000-0000000000${String(i + 1).padStart(2, '0')}` },
      update: {},
      create: {
        id: `p0000000-0000-0000-0000-0000000000${String(i + 1).padStart(2, '0')}`,
        store_id: i % 2 === 0 ? store1.id : store2.id,
        name: p.name,
        category: p.category,
        pet_type: p.petType,
        description: p.description,
        price: p.price,
        original_price: p.originalPrice || null,
        discount_percent: p.discountPercent || null,
        variants: p.variants || [],
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

  for (let i = 0; i < Math.min(mockServices.length, 10); i++) {
    const s = mockServices[i];
    const svc = await prisma.services.upsert({
      where: { id: `s0000000-0000-0000-0000-0000000000${String(i + 1).padStart(2, '0')}` },
      update: {},
      create: {
        id: `s0000000-0000-0000-0000-0000000000${String(i + 1).padStart(2, '0')}`,
        store_id: i % 2 === 0 ? svcStore1.id : svcStore2.id,
        name: s.name,
        service_type: s.serviceType,
        description: s.description,
        price_from: s.priceFrom,
        distance_or_location: s.location,
        image_url: s.image,
        rating: s.rating || 4.7,
        review_count: s.reviewCount || 5,
        is_active: true,
        approval_status: 'approved',
      },
    });
    if (Array.isArray(s.packages)) {
      for (let j = 0; j < s.packages.length; j++) {
        const pkg = s.packages[j];
        await prisma.service_packages.upsert({
          where: { id: `sp000000-0000-0000-0000-0000000000${String(i + 1)}${String(j + 1).padStart(2, '0')}` },
          update: {},
          create: {
            id: `sp000000-0000-0000-0000-0000000000${String(i + 1)}${String(j + 1).padStart(2, '0')}`,
            service_id: svc.id,
            name: pkg.name,
            description: pkg.description || null,
            price: pkg.price,
            duration: pkg.duration || null,
          },
        });
      }
    }
  }

  for (let i = 0; i < faqs.length; i++) {
    const f = faqs[i];
    await prisma.faqs.upsert({
      where: { id: `f0000000-0000-0000-0000-0000000000${String(i + 1).padStart(2, '0')}` },
      update: {},
      create: {
        id: `f0000000-0000-0000-0000-0000000000${String(i + 1).padStart(2, '0')}`,
        category: f.category || 'Umum',
        question: f.question,
        answer: f.answer,
        sort_order: i,
        is_published: true,
      },
    });
  }

  await prisma.platform_settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      commission_produk_percent: 5,
      commission_jasa_percent: 10,
    },
  });

  await prisma.platform_content.upsert({
    where: { key: 'syarat_ketentuan' },
    update: {},
    create: { key: 'syarat_ketentuan', title: 'Syarat & Ketentuan', body: '' },
  });
  await prisma.platform_content.upsert({
    where: { key: 'kebijakan_privasi' },
    update: {},
    create: { key: 'kebijakan_privasi', title: 'Kebijakan Privasi', body: '' },
  });
  await prisma.platform_content.upsert({
    where: { key: 'kebijakan_pembatalan' },
    update: {},
    create: { key: 'kebijakan_pembatalan', title: 'Kebijakan Pembatalan', body: '' },
  });

  console.log('Seed completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
EOF
echo "done"