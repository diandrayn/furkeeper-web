import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { handleApi, jsonOk, HttpError } from '@/lib/http';
import { requireUser } from '@/lib/session';

export const POST = handleApi(async (request) => {
  const user = await requireUser();
  const form = await request.formData();
  const file = form.get('file');
  if (!file || typeof file === 'string') throw new HttpError(400, 'File tidak ditemukan.');
  const ext = String(file.name || 'bin').split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'bin';
  const dir = path.join(process.cwd(), 'public', 'uploads', user.id);
  await mkdir(dir, { recursive: true });
  const filename = `${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);
  return jsonOk({ url: `/uploads/${user.id}/${filename}` });
});
