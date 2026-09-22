// Seed data + a mock generator for the Notification system. Timestamps for
// the seed list are fixed; the generator (used by the dev-only simulation in
// NotificationContext) stamps new notifications with the real current time.

export const seedNotifications = [
  {
    id: 'notif-seed-1',
    type: 'order_status',
    title: 'Pesanan Dikirim',
    message: 'Pesanan FK-ORD-KIRIM sedang dalam perjalanan menuju alamatmu.',
    timestamp: '2026-09-06T10:02:00+07:00',
    isRead: false,
    linkTo: '/pesanan/FK-ORD-KIRIM',
  },
  {
    id: 'notif-seed-2',
    type: 'booking_status',
    title: 'Booking Dikonfirmasi',
    message: 'Grooming & Spa untuk anjingmu telah dikonfirmasi oleh penyedia jasa.',
    timestamp: '2026-08-27T13:05:00+07:00',
    isRead: false,
    linkTo: '/booking/BK-KONFIRMASI/status',
  },
  {
    id: 'notif-seed-3',
    type: 'chat',
    title: 'Pesan Baru dari PawShop Klojen',
    message: 'Kalau ada kendala saat barang sampai, langsung chat kami saja ya kak.',
    timestamp: '2026-09-06T10:01:00+07:00',
    isRead: false,
    linkTo: '/chat/conv-1',
  },
  {
    id: 'notif-seed-4',
    type: 'promo',
    title: 'Promo Spesial Minggu Ini',
    message: 'Diskon hingga 20% untuk kebutuhan makanan kucing dan anjing kesayanganmu.',
    timestamp: '2026-09-04T08:00:00+07:00',
    isRead: true,
    linkTo: '/produk',
  },
  {
    id: 'notif-seed-5',
    type: 'review_reminder',
    title: 'Yuk, Beri Ulasan',
    message: 'Bagaimana pengalamanmu dengan pesanan Shampoo Anti Kutu & Jamur?',
    timestamp: '2026-08-25T09:00:00+07:00',
    isRead: true,
    linkTo: '/pesanan/FK-ORD-SELESAI',
  },
];

const generatorPool = [
  {
    type: 'order_status',
    title: 'Pesanan Diproses',
    message: 'Penjual sedang menyiapkan pesananmu.',
    linkTo: '/profil/riwayat',
  },
  {
    type: 'booking_status',
    title: 'Pengingat Jadwal Booking',
    message: 'Jadwal booking jasamu akan berlangsung besok.',
    linkTo: '/profil/riwayat',
  },
  {
    type: 'chat',
    title: 'Pesan Baru',
    message: 'Kamu mendapat pesan baru di kotak chat.',
    linkTo: '/chat',
  },
  {
    type: 'promo',
    title: 'Promo Baru Tersedia',
    message: 'Jangan lewatkan promo terbaru dari FurKeeper.',
    linkTo: '/produk',
  },
  {
    type: 'partner_status',
    title: 'Status Pengajuan Mitra',
    message: 'Ada pembaruan pada status pengajuan kemitraanmu.',
    linkTo: '/status-pengajuan',
  },
  {
    type: 'review_reminder',
    title: 'Yuk, Beri Ulasan',
    message: 'Bagikan pengalamanmu untuk membantu pengguna lain.',
    linkTo: '/profil/riwayat',
  },
];

let generatorIndex = 0;

// TODO: replace with real WebSocket/polling once backend is ready.
// Cycles through a fixed pool of mock notification shapes for demo purposes.
export function generateMockNotification() {
  const template = generatorPool[generatorIndex % generatorPool.length];
  generatorIndex += 1;
  return {
    id: `notif-${Date.now()}-${generatorIndex}`,
    type: template.type,
    title: template.title,
    message: template.message,
    linkTo: template.linkTo,
    timestamp: new Date().toISOString(),
    isRead: false,
  };
}