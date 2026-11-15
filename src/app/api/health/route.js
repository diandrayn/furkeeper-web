import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [profilesCount, storesCount, productsCount, servicesCount] = await Promise.all([
      prisma.profiles.count(),
      prisma.stores.count(),
      prisma.products.count(),
      prisma.services.count(),
    ]);

    return NextResponse.json({
      ok: true,
      counts: {
        profiles: profilesCount,
        stores: storesCount,
        products: productsCount,
        services: servicesCount,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Unknown error' },
      { status: 500 },
    );
  }
}
