export function filterAndSortItems(items, { query, queryFields, filters, priceField, sort }) {
  const needle = query.trim().toLowerCase();

  let next = items.filter((item) => {
    if (needle) {
      const haystack = queryFields.map((field) => String(item[field] || '')).join(' ').toLowerCase();
      if (!haystack.includes(needle)) return false;
    }

    if (filters.categories?.length && !filters.categories.includes(item.category)) return false;
    if (filters.petTypes?.length && !filters.petTypes.includes(item.petType)) return false;
    if (filters.serviceTypes?.length && !filters.serviceTypes.includes(item.serviceType)) return false;

    const price = item[priceField];
    if (price < filters.priceMin || price > filters.priceMax) return false;

    if (filters.rating && item.rating < Number(filters.rating)) return false;
    if (filters.location && item.location !== filters.location) return false;

    return true;
  });

  next = [...next].sort((a, b) => {
    if (sort === 'cheapest') return a[priceField] - b[priceField];
    if (sort === 'expensive') return b[priceField] - a[priceField];
    if (sort === 'rating') return b.rating - a.rating;
    return b.createdAt - a.createdAt;
  });

  return next;
}
