import { formatDateId } from '../utils/status';

// Bundled fallback for /kebijakan-pembatalan — shown only until an admin
// fills in "Kebijakan Pembatalan" under Pengaturan Platform (the CMS row
// `kebijakan_pembatalan`, see supabase/platform_content_migration.sql).
//
// This is deliberately a neutral template: it describes how cancellation
// works in general but commits to NO specific time windows, fees, or refund
// amounts — those are business decisions and belong in the admin-edited
// version. Same shape as the CMS branch in LegalPage.jsx builds.
export const cancellationContent = {
  title: 'Kebijakan Pembatalan',
  updatedAt: formatDateId('2026-09-20T00:00:00.000Z'),
  sections: [
    {
      id: 'ringkasan',
      title: 'Ringkasan',
      paragraphs: [
        'Halaman ini menjelaskan bagaimana pembatalan pesanan produk dan pemesanan jasa (booking) ditangani di FurKeeper.',
        'Ketentuan rinci mengenai batas waktu pembatalan, biaya, dan pengembalian dana sedang dilengkapi oleh tim kami. Sementara itu, berlaku ketentuan umum di bawah ini.',
      ],
    },
    {
      id: 'pesanan-produk',
      title: 'Pembatalan Pesanan Produk',
      paragraphs: [
        'Pesanan yang masih menunggu pembayaran dapat dibatalkan. Setelah pesanan diproses atau dikirim oleh toko, pembatalan bergantung pada persetujuan toko dan status pengiriman.',
        'Jika terjadi masalah pada pesanan yang sudah dibayar, kamu dapat menghubungi toko lewat fitur chat atau mengajukan laporan agar dapat kami bantu tindaklanjuti.',
      ],
    },
    {
      id: 'booking-jasa',
      title: 'Pembatalan Booking Jasa',
      paragraphs: [
        'Booking yang masih menunggu konfirmasi penyedia jasa dapat dibatalkan. Untuk booking yang sudah dikonfirmasi, pembatalan mengikuti kesepakatan dengan penyedia jasa terkait.',
        'Kami menyarankan untuk membatalkan atau menjadwalkan ulang sesegera mungkin agar penyedia jasa dapat mengatur waktunya.',
      ],
    },
    {
      id: 'pengembalian-dana',
      title: 'Pengembalian Dana',
      paragraphs: [
        'Bila pembatalan disetujui dan pembayaran sudah dilakukan, pengembalian dana akan diproses sesuai metode pembayaran yang digunakan.',
      ],
    },
    {
      id: 'bantuan',
      title: 'Butuh Bantuan?',
      paragraphs: [
        'Jika ada pertanyaan atau kendala terkait pembatalan, silakan kunjungi Pusat Bantuan atau hubungi kami melalui halaman Kontak.',
      ],
    },
  ],
};
