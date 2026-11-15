import { slugify } from '@/lib/slug';
import { formatDateId } from '@/utils/status';

export function num(value) {
  return Number(value || 0);
}

export function mapPublicProduct(row) {
  const store = row.store || row.stores || {};
  const originalPrice = row.original_price;
  return {
    id: row.id,
    storeId: row.store_id,
    name: row.name,
    storeName: store.name || 'Toko',
    storeLocation: store.location || store.district || '',
    storeRating: num(store.rating),
    storeTrusted: Boolean(store.trusted),
    price: row.price,
    originalPrice,
    discountPercent:
      row.discount_percent ??
      (originalPrice ? Math.round(((originalPrice - row.price) / originalPrice) * 100) : null),
    rating: num(row.rating),
    soldCount: row.sold_count || 0,
    reviewCount: 0,
    badge: row.badge,
    category: row.category,
    petType: row.pet_type,
    location: store.location || store.district || '',
    variants: row.variants || [],
    stock: row.stock,
    imageUrl: row.image_url,
    createdAt: new Date(row.created_at).getTime(),
    description: row.description || '',
  };
}

export function mapDashboardProduct(row) {
  return {
    id: row.id,
    sku: `PWK-${String(row.id).slice(0, 8).toUpperCase()}`,
    name: row.name,
    category: row.category,
    petType: row.pet_type,
    description: row.description || '',
    price: row.price,
    originalPrice: row.original_price,
    stock: row.stock,
    status: row.stock === 0 ? 'habis' : row.is_active ? 'aktif' : 'nonaktif',
    imageUrl: row.image_url,
    rating: num(row.rating),
    sold: row.sold_count || 0,
    approvalStatus: row.approval_status || 'approved',
    rejectionReason: row.rejection_reason || null,
    createdAt: row.created_at,
  };
}

export function mapPublicService(row) {
  const store = row.store || row.stores || {};
  return {
    id: row.id,
    storeId: row.store_id,
    name: row.name,
    providerName: store.name || 'Penyedia Jasa',
    serviceType: row.service_type,
    priceFrom: row.price_from,
    duration: row.duration || '',
    rating: num(row.rating),
    reviewCount: row.review_count || 0,
    distanceOrLocation: store.location || store.district || '',
    location: store.location || store.district || '',
    badge: null,
    trusted: Boolean(store.trusted),
    fastResponse: Boolean(store.fast_response),
    imageUrl: row.image_url,
    imageCount: 0,
    packages: [
      {
        id: `default-${row.id}`,
        name: row.name,
        description: row.description || '',
        durationEstimate: row.duration || '-',
        price: row.price_from,
      },
    ],
    createdAt: new Date(row.created_at).getTime(),
    description: row.description || '',
  };
}

export function mapDashboardService(row) {
  return {
    id: row.id,
    name: row.name,
    serviceType: row.service_type,
    description: row.description || '',
    price: row.price_from,
    duration: row.duration || '',
    status: row.is_active ? 'aktif' : 'nonaktif',
    imageUrl: row.image_url,
    rating: num(row.rating),
    booked: row.booked_count || 0,
    approvalStatus: row.approval_status || 'approved',
    rejectionReason: row.rejection_reason || null,
    createdAt: row.created_at,
  };
}

export function mapStoreRow(row) {
  return {
    id: row.id,
    kind: row.kind,
    name: row.name,
    slug: row.slug || slugify(row.name || 'toko'),
    tagline: row.tagline || '',
    description: row.description || '',
    storePolicy: row.store_policy || '',
    category: row.category || '',
    location: row.location || '',
    address: row.address || '',
    district: row.district || '',
    city: row.city || '',
    homeService: Boolean(row.home_service),
    isOpen: row.is_open !== false,
    operatingHours: Array.isArray(row.operating_hours) ? row.operating_hours : [],
    logoUrl: row.logo_url || null,
    bannerUrl: row.banner_url || null,
    trusted: Boolean(row.trusted),
    fastResponse: Boolean(row.fast_response),
    rating: num(row.rating),
    ownerId: row.owner_id,
    productCount: row.product_count ?? row.products?.[0]?.count ?? row._count?.products ?? 0,
    serviceCount: row.service_count ?? row.services?.[0]?.count ?? row._count?.services ?? 0,
    createdAt: row.created_at,
  };
}

export function mapStoreProfile(row) {
  return {
    name: row.name || '',
    slug: row.slug || slugify(row.name || 'toko'),
    category: row.category || '',
    tagline: row.tagline || '',
    description: row.description || '',
    logoUrl: row.logo_url || null,
    bannerUrl: row.banner_url || null,
    phone: row.phone || '',
    email: row.email || '',
    address: row.address || '',
    district: row.district || '',
    city: row.city || '',
    storePolicy: row.store_policy || '',
    homeService: Boolean(row.home_service),
    isOpen: row.is_open !== false,
    operatingHours: Array.isArray(row.operating_hours) ? row.operating_hours : [],
    joinedAt: new Date(row.created_at).getTime(),
  };
}

function mapPaymentSummary(row) {
  if (!row) return null;
  return {
    id: row.id,
    status: row.status,
    method: row.payment_type || null,
    grossAmount: row.gross_amount,
    paidAt: row.paid_at ? new Date(row.paid_at).getTime() : null,
    expiresAt: row.expires_at ? new Date(row.expires_at).getTime() : null,
    snapRedirectUrl: row.snap_redirect_url || null,
  };
}

export function mapOrderRow(row) {
  const items = row.items || row.order_items || [];
  const first = items[0] || {};
  return {
    id: row.id,
    type: 'product',
    status: row.status,
    createdAt: new Date(row.created_at).getTime(),
    totalPrice: row.total,
    subtotal: row.subtotal,
    shippingCost: row.shipping_cost,
    paymentMethod: row.payment_method || '',
    payment: mapPaymentSummary(row.payment),
    name: first.name || 'Pesanan produk',
    thumbnail: null,
    variant: first.variant || '',
    qty: items.reduce((sum, i) => sum + i.quantity, 0),
    price: first.price || 0,
    storeName: first.store?.name || first.stores?.name || null,
    storeId: first.store_id || null,
    address: row.shipping_address || null,
    tracking: row.tracking_number || null,
    items,
  };
}

export function mapStoreOrder(row) {
  const items = row.items || row.order_items || [];
  const first = items[0] || {};
  return {
    id: row.id,
    status: row.status,
    createdAt: new Date(row.created_at).getTime(),
    productName: first.name || '-',
    qty: items.reduce((sum, i) => sum + i.quantity, 0),
    variant: first.variant || '',
    price: first.price || 0,
    totalPrice: row.total,
    paymentMethod: row.payment_method || '-',
    payment: mapPaymentSummary(row.payment),
    buyerName: row.profile?.full_name || row.buyer?.full_name || 'Pembeli',
    buyerPhone: row.profile?.phone || row.buyer?.phone || '-',
    address: row.shipping_address || null,
    note: null,
    items,
  };
}

export function mapBookingRow(row) {
  const service = row.service || row.services || {};
  const store = service.store || service.stores || {};
  return {
    id: row.id,
    type: 'service',
    status: row.status,
    createdAt: new Date(row.created_at).getTime(),
    totalPrice: row.price,
    price: row.price,
    name: service.name || 'Booking jasa',
    thumbnail: null,
    date: row.scheduled_date,
    time: row.scheduled_time,
    packageName: row.package?.name || row.packages?.name || row.service_packages?.name || service.name || null,
    packagePrice: row.price,
    petId: row.pet_id,
    petName: row.pet_name || row.pet?.name || row.pets?.name || '',
    providerName: store.name || 'Penyedia Jasa',
    providerRating: null,
    storeId: service.store_id || null,
    serviceId: row.service_id,
    reviewed: false,
    reviewedCheck: true,
  };
}

export function mapProviderBooking(row) {
  return {
    id: row.id,
    status: row.status,
    createdAt: new Date(row.created_at).getTime(),
    serviceName: row.service?.name || '-',
    date: row.scheduled_date,
    time: row.scheduled_time,
    price: row.price,
    note: row.notes || null,
    buyerName: row.buyer_name || row.buyer?.full_name || 'Pembeli',
    buyerPhone: row.buyer_phone || row.buyer?.phone || '-',
    petName: row.pet_name || '',
    petType: row.pet_species || '',
    addressType: 'Alamat',
    address: null,
  };
}

export function mapMessageRow(row) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    text: row.content,
    timestamp: row.created_at,
    isRead: row.is_read,
  };
}

export function mapStoreReview(row) {
  return {
    id: row.id,
    reviewerName: row.author?.full_name || row.profiles?.full_name || 'Pengguna',
    reviewerAvatar: row.author?.avatar_url || row.profiles?.avatar_url || null,
    rating: row.rating,
    date: formatDateId(row.created_at),
    comment: row.comment || '',
    reply: row.reply || null,
    targetName: row.product?.name || row.service?.name || row.products?.name || row.services?.name || null,
  };
}
