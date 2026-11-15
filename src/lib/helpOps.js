import { prisma } from '@/lib/prisma';

export async function createHelpMessage(user, payload) {
  await prisma.help_messages.create({
    data: {
      user_id: user.id,
      name: payload.name,
      email: payload.email,
      subject: payload.subject || null,
      body: payload.body,
    },
  });
  return { ok: true };
}

export async function fetchMyHelpMessages(user) {
  const rows = await prisma.help_messages.findMany({
    where: { user_id: user.id },
    include: { replier: { select: { full_name: true } } },
    orderBy: { created_at: 'desc' },
  });
  return rows.map((row) => ({
    id: row.id,
    subject: row.subject || '-',
    body: row.body,
    status: row.status,
    adminReply: row.admin_reply,
    repliedByName: row.replier?.full_name || null,
    repliedAt: row.replied_at,
    createdAt: row.created_at,
  }));
}
