import { prisma } from '@/lib/prisma';

export async function notify(userId, { type, title, body = null, link = null }) {
  if (!userId) return;
  try {
    await prisma.notifications.create({
      data: { user_id: userId, type, title, body, link },
    });
  } catch (err) {
    console.error('notify failed:', err);
  }
}
