export function applyListingApproval(user, existing, patch, contentKeys) {
  if (user.role === 'admin') return patch;
  if (!existing) {
    return {
      ...patch,
      approval_status: 'pending',
      rejection_reason: null,
      reviewed_by: null,
      reviewed_at: null,
    };
  }
  const contentChanged = contentKeys.some((key) => {
    if (patch[key] === undefined) return false;
    return JSON.stringify(patch[key]) !== JSON.stringify(existing[key]);
  });
  if (contentChanged && existing.approval_status !== 'pending') {
    return {
      ...patch,
      approval_status: 'pending',
      rejection_reason: null,
      reviewed_by: null,
      reviewed_at: null,
    };
  }
  return patch;
}

export const PRODUCT_CONTENT_KEYS = [
  'name',
  'description',
  'category',
  'pet_type',
  'price',
  'image_url',
  'images',
];
export const SERVICE_CONTENT_KEYS = [
  'name',
  'description',
  'service_type',
  'price_from',
  'image_url',
];
