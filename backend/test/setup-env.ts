import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

// Runs before any app code is imported. Tests use their own database and a throwaway uploads folder.
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgresql://roomie:roomie@localhost:5433/roomie_test?schema=public';
process.env.JWT_SECRET = 'test-secret';
process.env.SMTP_USER = '';
process.env.UPLOAD_DIR = mkdtempSync(join(tmpdir(), 'roomie-uploads-'));
