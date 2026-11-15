import { prisma } from '@/lib/prisma';

export const ACTIVITY_ACTION_LABELS = {
  approve_partner: 'Menyetujui pendaftaran mitra',
  reject_partner: 'Menolak pendaftaran mitra',
  suspend_user: 'Men-suspend akun pengguna',
  unsuspend_user: 'Mengaktifkan kembali akun pengguna',
  activate_product: 'Mengaktifkan produk',
  deactivate_product: 'Menonaktifkan produk',
  delete_product: 'Menghapus produk',
  activate_service: 'Mengaktifkan jasa',
  deactivate_service: 'Menonaktifkan jasa',
  delete_service: 'Menghapus jasa',
  delete_review: 'Menghapus ulasan',
  update_report_status: 'Mengubah status laporan',
  update_report_priority: 'Mengubah prioritas laporan',
  reply_report: 'Membalas laporan',
  create_category: 'Menambah kategori',
  rename_category: 'Mengubah nama kategori',
  delete_category: 'Menghapus kategori',
  reply_help_message: 'Membalas pesan bantuan',
  promote_admin: 'Menambahkan admin baru',
  update_admin_scope: 'Mengubah hak akses admin',
  demote_admin: 'Menurunkan admin ke pengguna biasa',
  update_commission_rate: 'Mengubah rate komisi platform',
  update_withdrawal_status: 'Mengubah status pencairan dana',
  approve_product: 'Menyetujui produk',
  reject_product: 'Menolak produk',
  approve_service: 'Menyetujui jasa',
  reject_service: 'Menolak jasa',
  create_faq: 'Menambah FAQ',
  update_faq: 'Mengubah FAQ',
  delete_faq: 'Menghapus FAQ',
  update_platform_content: 'Mengubah konten statis platform',
  create_platform_content: 'Menambah konten statis platform',
  delete_platform_content: 'Menghapus konten statis platform',
};

export async function logAdminActivity(actor, action, targetType, targetId, targetLabel = null, detail = null) {
  try {
    if (!actor?.id) return;
    await prisma.admin_activity_log.create({
      data: {
        actor_id: actor.id,
        actor_name: actor.full_name || actor.email || null,
        action,
        action_label: ACTIVITY_ACTION_LABELS[action] || action,
        target_type: targetType,
        target_id: targetId || null,
        target_label: targetLabel,
        detail,
      },
    });
  } catch (err) {
    console.error('logAdminActivity failed:', err);
  }
}
