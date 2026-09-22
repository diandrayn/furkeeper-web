// Data layer for the *sender's* side of Kelola Pesan / Pusat Bantuan
// (/bantuan-saya) — the counterpart to utils/admin.js's fetchHelpMessages
// / replyHelpMessage, but scoped to "my own messages" instead of the full
// inbox. Relies on the "sender reads own help messages" RLS policy added
// in supabase/help_messages_user_access_migration.sql — without that
// migration this will just return an empty list (or a permission error)
// even for the sender's own rows.
import { supabase } from '../lib/supabaseClient';

export const HELP_MESSAGE_STATUS_LABELS = {
  belum_dibalas: 'Belum dibalas',
  sudah_dibalas: 'Sudah dibalas',
};

function mapMyHelpMessageRow(row) {
  return {
    id: row.id,
    subject: row.subject || '-',
    body: row.body,
    status: row.status,
    adminReply: row.admin_reply,
    repliedByName: row.replied_by_profile?.full_name || null,
    repliedAt: row.replied_at,
    createdAt: row.created_at,
  };
}

/** Pesan yang pernah dikirim oleh user ini lewat /kontak, terbaru dulu. */
export async function fetchMyHelpMessages(userId) {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('help_messages')
    .select('*, replied_by_profile:profiles!help_messages_replied_by_fkey(full_name)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(mapMyHelpMessageRow);
}
