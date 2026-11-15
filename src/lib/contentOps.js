import { prisma } from '@/lib/prisma';

export async function fetchPlatformContent(key) {
  const data = await prisma.platform_content.findUnique({ where: { key } });
  if (!data || !String(data.body || '').trim()) return null;
  return { title: data.title, body: data.body, updatedAt: data.updated_at };
}

export async function fetchPublishedFaqs() {
  return prisma.faqs.findMany({
    where: { is_published: true },
    select: { id: true, category: true, question: true, answer: true },
    orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
  });
}
