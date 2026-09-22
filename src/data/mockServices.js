export const SERVICE_PAGE_SIZE = 12;

export const serviceTypes = ['Mandi', 'Potong Bulu', 'Grooming Lengkap'];

const providers = [
  { providerName: 'Grooming Happy Paws', location: 'Klojen', trusted: true, fastResponse: true },
  { providerName: 'Salon Anabul Malang', location: 'Lowokwaru', trusted: true, fastResponse: false },
  { providerName: 'Paws & Relax', location: 'Blimbing', trusted: false, fastResponse: true },
  { providerName: 'Pet Spa Sukun', location: 'Sukun', trusted: true, fastResponse: true },
  { providerName: 'Gentle Groom Kedungkandang', location: 'Kedungkandang', trusted: false, fastResponse: false },
];

const templates = [
  {
    name: 'Grooming & Spa Lengkap untuk Anjing Medium',
    serviceType: 'Grooming Lengkap',
    priceFrom: 150000,
    distanceOrLocation: 'Kecamatan Klojen',
  },
  {
    name: 'Mandi Sehat + Blow Dry Kucing',
    serviceType: 'Mandi',
    priceFrom: 85000,
    distanceOrLocation: 'Kecamatan Lowokwaru',
  },
  {
    name: 'Potong Bulu Rapi Model Teddy',
    serviceType: 'Potong Bulu',
    priceFrom: 120000,
    distanceOrLocation: 'Kecamatan Blimbing',
  },
  {
    name: 'Grooming Lengkap Anti Kutu',
    serviceType: 'Grooming Lengkap',
    priceFrom: 185000,
    distanceOrLocation: 'Kecamatan Sukun',
  },
  {
    name: 'Mandi Herbal Anjing Sensitif',
    serviceType: 'Mandi',
    priceFrom: 95000,
    distanceOrLocation: 'Kecamatan Kedungkandang',
  },
  {
    name: 'Potong Kuku & Rapikan Telinga',
    serviceType: 'Potong Bulu',
    priceFrom: 65000,
    distanceOrLocation: 'Kecamatan Klojen',
  },
];

const packageSets = [
  [
    {
      id: 'pkg-1',
      name: 'Mandi Sehat',
      description: 'Mandi shampoo khusus hewan, keringkan, dan parfum ringan.',
      durationEstimate: '45 menit',
      price: 85000,
    },
    {
      id: 'pkg-2',
      name: 'Potong Bulu',
      description: 'Potong dan rapikan bulu sesuai permintaan, termasuk sisir rapi.',
      durationEstimate: '60 menit',
      price: 120000,
    },
    {
      id: 'pkg-3',
      name: 'Grooming Lengkap',
      description: 'Mandi, potong bulu, kuku, telinga, dan spa ringan dalam satu sesi.',
      durationEstimate: '90 menit',
      price: 185000,
    },
  ],
];

function buildServices(count = 48) {
  return Array.from({ length: count }, (_, index) => {
    const template = templates[index % templates.length];
    const provider = providers[index % providers.length];
    const cycle = Math.floor(index / templates.length);
    const priceFrom = template.priceFrom + cycle * 10000;
    const rating = Number((4.4 + ((index * 5) % 6) * 0.1).toFixed(1));
    const reviewCount = 18 + ((index * 23) % 280);
    const badge = provider.fastResponse && index % 3 === 0 ? 'Respon Cepat' : null;

    return {
      id: index + 1,
      name: cycle === 0 ? template.name : `${template.name} — Paket ${cycle + 1}`,
      providerName: provider.providerName,
      serviceType: template.serviceType,
      priceFrom,
      rating,
      reviewCount,
      distanceOrLocation: `Kecamatan ${provider.location}`,
      location: provider.location,
      badge,
      trusted: provider.trusted,
      fastResponse: provider.fastResponse,
      imageCount: 8,
      createdAt: Date.now() - index * 43200000,
      packages: packageSets[0],
      description:
        'Layanan profesional dengan peralatan steril dan produk ramah kulit. Jadwal fleksibel, staf berpengalaman, dan hasil rapi sesuai karakter hewan kamu.',
    };
  });
}

export const services = buildServices(48);

export function getServiceById(id) {
  return services.find((item) => String(item.id) === String(id)) ?? null;
}

export const serviceReviewTags = [
  { label: 'Tepat waktu', count: 120 },
  { label: 'Ramah', count: 98 },
  { label: 'Hasil rapi', count: 85 },
  { label: 'Hewan nyaman', count: 64 },
];
