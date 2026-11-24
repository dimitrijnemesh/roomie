import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { unlink, writeFile } from 'fs/promises';
import { join, resolve } from 'path';

/** Local photo storage for the MVP (later: Cloudinary). Files are served at /uploads/<file>. */
export const UPLOAD_DIR = resolve(process.env.UPLOAD_DIR ?? 'uploads');
mkdirSync(UPLOAD_DIR, { recursive: true });

export const publicUrl = (file: string) =>
  `${(process.env.PUBLIC_URL ?? `http://localhost:${process.env.PORT ?? 3000}`).replace(/\/$/, '')}/uploads/${file}`;

export async function saveFile(data: Buffer, ext: string): Promise<string> {
  const file = `${randomUUID()}.${ext}`;
  await writeFile(join(UPLOAD_DIR, file), data);
  return file;
}

export async function removeFile(file: string) {
  await unlink(join(UPLOAD_DIR, file)).catch(() => undefined);
}
