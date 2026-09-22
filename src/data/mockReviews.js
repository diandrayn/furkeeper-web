const comments = [
  'Produknya original dan pengiriman cepat. Hewan peliharaanku langsung suka!',
  'Kualitas sesuai deskripsi. Paket rapi, penjual juga cepat merespons.',
  'Sudah pesan ulang. Harga masuk akal dan barangnya awet dipakai.',
  'Agak lama sampai, tapi barangnya bagus. Sangat direkomendasikan.',
  'Hasilnya rapi dan hewanku tetap tenang selama proses. Terima kasih!',
  'Pelayanan ramah, tempat bersih, dan hasil sesuai foto portofolio.',
];

const names = ['Nadia P.', 'Rizky A.', 'Dina W.', 'Bima S.', 'Laras M.', 'Fajar K.'];

function buildReview(index, extra = {}) {
  const ratingPool = [5, 5, 5, 4, 4, 3];
  return {
    id: extra.id ?? index + 1,
    reviewerName: names[index % names.length],
    rating: extra.rating ?? ratingPool[index % ratingPool.length],
    date: extra.date ?? `12 Agu 2026`,
    comment: comments[index % comments.length],
    buyerPhotoCount: index % 3 === 0 ? 3 : index % 2 === 0 ? 2 : 0,
    ...extra,
  };
}

export const reviews = Array.from({ length: 8 }, (_, index) => buildReview(index));

export function getReviewsForTarget(targetId, count = 6) {
  const seed = Number(targetId) || 1;
  return Array.from({ length: count }, (_, index) =>
    buildReview(index + seed, {
      id: `${targetId}-r${index + 1}`,
      date: `${10 + ((seed + index) % 18)} Agu 2026`,
    }),
  );
}

export function getRatingDistribution(reviewList) {
  const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviewList.forEach((review) => {
    const star = Math.min(5, Math.max(1, Math.round(review.rating)));
    counts[star] += 1;
  });
  const total = reviewList.length || 1;
  return [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: counts[star],
    percent: Math.round((counts[star] / total) * 100),
  }));
}
