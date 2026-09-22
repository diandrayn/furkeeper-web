// Public read side of the Pengaturan Platform CMS (§2.14). Separate from
// utils/admin.js on purpose — this is called from public pages (LegalPage
// and friends), not the admin panel, and needs no admin session; RLS
// (see supabase/platform_content_migration.sql) already makes the table
// publicly readable.
import { supabase } from '../lib/supabaseClient';

/** Returns { title, body, updatedAt } or null if the key doesn't exist yet
 * (e.g. migration not applied) or its body is still empty — callers should
 * fall back to their own bundled copy in either case. */
export async function fetchPlatformContent(key) {
  try {
    const { data, error } = await supabase.from('platform_content').select('*').eq('key', key).single();
    if (error || !data || !data.body?.trim()) return null;
    return { title: data.title, body: data.body, updatedAt: data.updated_at };
  } catch (err) {
    console.error(`fetchPlatformContent(${key}) failed:`, err);
    return null;
  }
}

/** Published FAQ entries for the public Pusat Bantuan page, in admin-defined
 * order. Returns [] when the table is missing (migration not applied), empty,
 * or the request fails — callers should then fall back to the bundled
 * src/data/mockFaqs.js so the page is never blank.
 * Shape: { id, category, question, answer }[] (needs supabase/faq_migration.sql). */
export async function fetchPublishedFaqs() {
  try {
    const { data, error } = await supabase
      .from('faqs')
      .select('id, category, question, answer')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('fetchPublishedFaqs failed:', err);
    return [];
  }
}
