export function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function uniqueStoreSlug(prisma, name, excludeId = null) {
  const base = slugify(name || 'toko') || 'toko';
  let slug = base;
  let n = 1;
  for (;;) {
    const existing = await prisma.stores.findFirst({
      where: {
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (!existing) return slug;
    n += 1;
    slug = `${base}-${n}`;
  }
}
