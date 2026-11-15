import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/http';

export async function createReview(user, payload) {
  const row = await prisma.reviews.create({
    data: {
      author_id: user.id,
      product_id: payload.productId || null,
      service_id: payload.serviceId || null,
      order_id: payload.orderId || null,
      booking_id: payload.bookingId || null,
      rating: payload.rating,
      comment: payload.comment || null,
    },
  });
  return row;
}

export async function hasReviewed(user, { orderId, bookingId }) {
  const count = await prisma.reviews.count({
    where: {
      author_id: user.id,
      ...(orderId ? { order_id: orderId } : {}),
      ...(bookingId ? { booking_id: bookingId } : {}),
    },
  });
  return count > 0;
}

export async function replyToReview(user, reviewId, reply) {
  const review = await prisma.reviews.findUnique({
    where: { id: reviewId },
    include: { product: { include: { store: true } }, service: { include: { store: true } } },
  });
  if (!review) throw new HttpError(404, 'Ulasan tidak ditemukan.');
  const ownerId = review.product?.store?.owner_id || review.service?.store?.owner_id;
  if (ownerId !== user.id && user.role !== 'admin') throw new HttpError(403, 'Akses ditolak.');
  await prisma.reviews.update({ where: { id: reviewId }, data: { reply } });
  return { ok: true };
}

export async function deleteReview(user, reviewId) {
  const review = await prisma.reviews.findUnique({ where: { id: reviewId } });
  if (!review) throw new HttpError(404, 'Ulasan tidak ditemukan.');
  if (review.author_id !== user.id && user.role !== 'admin') throw new HttpError(403, 'Akses ditolak.');
  await prisma.reviews.delete({ where: { id: reviewId } });
  return { ok: true };
}
