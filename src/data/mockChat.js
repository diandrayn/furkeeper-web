// Seed data for the Chat system. Timestamps are fixed (not Date.now()) so the
// seed data itself stays pure/stable across renders.

export const AUTO_REPLIES = [
  'Baik kak, ditunggu ya!',
  'Terima kasih sudah menghubungi kami 🙏',
  'Untuk itu bisa dibantu, mohon tunggu sebentar ya kak.',
  'Siap, akan segera kami proses.',
  'Halo kak, ada yang bisa dibantu?',
];

export const seedConversations = [
  {
    id: 'conv-1',
    participant: {
      id: 'seller-pawshop-klojen',
      name: 'PawShop Klojen',
      avatarUrl: null,
      role: 'seller',
    },
    unreadCount: 2,
    context: {
      type: 'order',
      thumbnail:
        'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=200&h=200&fit=crop',
      title: 'Pesanan FK-ORD-KIRIM',
      linkTo: '/pesanan/FK-ORD-KIRIM',
    },
  },
  {
    id: 'conv-2',
    participant: {
      id: 'provider-grooming-happy-paws',
      name: 'Grooming Happy Paws',
      avatarUrl: null,
      role: 'provider',
    },
    unreadCount: 0,
    context: {
      type: 'booking',
      thumbnail:
        'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=200&h=200&fit=crop',
      title: 'Booking BK-MENUNGGU',
      linkTo: '/booking/BK-MENUNGGU/status',
    },
  },
  {
    id: 'conv-3',
    participant: {
      id: 'seller-petcare-malang',
      name: 'PetCare Malang',
      avatarUrl: null,
      role: 'seller',
    },
    unreadCount: 0,
    context: {
      type: 'product',
      thumbnail:
        'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=200&h=200&fit=crop',
      title: 'Pet Carrier Travel Bag Premium Medium Size',
      linkTo: '/produk/2',
    },
  },
];

export const seedMessages = {
  'conv-1': [
    {
      id: 'msg-1-1',
      conversationId: 'conv-1',
      senderId: 'seller-pawshop-klojen',
      text: 'Halo kak, pesanan Royal Canin Kitten sudah kami kirim ya.',
      timestamp: '2026-09-05T09:00:00+07:00',
    },
    {
      id: 'msg-1-2',
      conversationId: 'conv-1',
      senderId: 'me',
      text: 'Oke kak, terima kasih infonya!',
      timestamp: '2026-09-05T09:05:00+07:00',
    },
    {
      id: 'msg-1-3',
      conversationId: 'conv-1',
      senderId: 'seller-pawshop-klojen',
      text: 'Sama-sama kak, estimasi sampai 2-3 hari kerja ya.',
      timestamp: '2026-09-06T10:00:00+07:00',
    },
    {
      id: 'msg-1-4',
      conversationId: 'conv-1',
      senderId: 'seller-pawshop-klojen',
      text: 'Kalau ada kendala saat barang sampai, langsung chat kami saja ya kak.',
      timestamp: '2026-09-06T10:01:00+07:00',
    },
  ],
  'conv-2': [
    {
      id: 'msg-2-1',
      conversationId: 'conv-2',
      senderId: 'provider-grooming-happy-paws',
      text: 'Halo kak, booking grooming Mochi sudah kami terima, menunggu konfirmasi jadwal ya.',
      timestamp: '2026-08-31T08:05:00+07:00',
    },
    {
      id: 'msg-2-2',
      conversationId: 'conv-2',
      senderId: 'me',
      text: 'Baik, ditunggu konfirmasinya kak 🙏',
      timestamp: '2026-08-31T08:10:00+07:00',
    },
  ],
  'conv-3': [
    {
      id: 'msg-3-1',
      conversationId: 'conv-3',
      senderId: 'me',
      text: 'Kak, carrier ukuran M muat untuk kucing 5kg nggak ya?',
      timestamp: '2026-08-20T15:00:00+07:00',
    },
    {
      id: 'msg-3-2',
      conversationId: 'conv-3',
      senderId: 'seller-petcare-malang',
      text: 'Muat kak, ukuran M cocok untuk kucing sampai 7kg.',
      timestamp: '2026-08-20T15:12:00+07:00',
    },
  ],
};