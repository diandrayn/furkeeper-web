/**
 * Parsing helpers for the Legal pages (Syarat & Ketentuan, Kebijakan
 * Privasi, Kebijakan Pembatalan). Admin-edited bodies (Pengaturan Platform)
 * are plain text with light markdown-ish markers; these helpers turn that
 * into the same section shape LegalPage renders for the bundled templates.
 *
 * Marker rules (also shown as a hint in AdminSettingsPage):
 *   "## Judul"  → starts a new numbered section
 *   "- item"    → bullet list item inside the current section
 *   "1. item"   → numbered list item inside the current section
 *   other text  → paragraph
 * A body with no "## " at all becomes a single fallback section.
 */

/** "3. Pendaftaran" → "Pendaftaran". Sections are numbered by their
 * position on the page, so a numeric prefix written by the admin/author is
 * dropped to avoid "1. 1. Pendahuluan". */
export function stripSectionNumber(title) {
  return String(title || '').replace(/^\d+\s*[.)]?\s*/, '').trim() || String(title || '').trim();
}

/** Free text → anchor id ("## 3. Pendaftaran Akun" → "pendaftaran-akun"). */
export function slugifySection(title) {
  return (
    String(title || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-') || 'konten'
  );
}

/** Parses an admin body into `{ id, title, paragraphs, numbered, bullets }[]`. */
export function parseLegalBody(body) {
  const lines = String(body || '').split(/\r?\n/);
  const sections = [];
  let current = null;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (line.startsWith('## ')) {
      const title = line.slice(3).trim();
      current = {
        id: slugifySection(title),
        title,
        paragraphs: [],
        numbered: [],
        bullets: [],
      };
      sections.push(current);
      continue;
    }

    if (!current) {
      // Text before any "## " (or a body with no sections at all) goes into
      // a single fallback section so nothing gets dropped.
      current = { id: 'konten', title: 'Konten', paragraphs: [], numbered: [], bullets: [] };
      sections.push(current);
    }

    if (line.startsWith('- ')) {
      current.bullets.push(line.slice(2).trim());
    } else if (/^\d+[.)]\s+/.test(line)) {
      current.numbered.push(line.replace(/^\d+[.)]\s+/, ''));
    } else {
      current.paragraphs.push(line);
    }
  }

  if (sections.length === 0) {
    sections.push({ id: 'konten', title: 'Konten', paragraphs: [], numbered: [], bullets: [] });
  }
  return sections;
}