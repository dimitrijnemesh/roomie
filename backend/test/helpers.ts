import { INestApplication } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ApiExceptionFilter } from '../src/common/filters/api-exception.filter';
import { validationPipe } from '../src/common/pipes/validation.pipe';
import { MailService } from '../src/mail/mail.service';
import { PrismaService } from '../src/prisma/prisma.service';

export type SentMail = { to: string; kind: 'verify' | 'reset'; code: string };

/** Instead of sending emails, remembers them so tests can read the codes. */
export class FakeMail {
  sent: SentMail[] = [];
  async sendVerificationCode(to: string, _name: string, code: string) {
    this.sent.push({ to, kind: 'verify', code });
  }
  async sendPasswordResetCode(to: string, _name: string, code: string) {
    this.sent.push({ to, kind: 'reset', code });
  }
  last(to: string, kind: SentMail['kind']) {
    return [...this.sent].reverse().find((m) => m.to === to && m.kind === kind);
  }
}

/** A fresh app per test: same pipes and filters as main.ts, fresh rate-limit counters. */
export async function createApp() {
  const mail = new FakeMail();
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(MailService)
    .useValue(mail)
    .compile();

  const app = moduleRef.createNestApplication<NestExpressApplication>();
  app.useBodyParser('json', { limit: '100kb' });
  app.useGlobalPipes(validationPipe);
  app.useGlobalFilters(new ApiExceptionFilter());
  await app.init();

  const prisma = app.get(PrismaService);
  await prisma.$executeRawUnsafe('TRUNCATE "photos", "profiles", "email_codes", "users" CASCADE');

  return { app, mail, prisma, http: () => request(app.getHttpServer()) };
}

export const PASSWORD = 'roomie2026!';

/** Registers and confirms a user; returns their token. */
export async function signUp(app: INestApplication, mail: FakeMail, email: string, password = PASSWORD) {
  const http = request(app.getHttpServer());
  await http.post('/auth/register').send({ email, password, name: 'Іван' }).expect(201);
  const code = mail.last(email, 'verify')!.code;
  const res = await request(app.getHttpServer()).post('/auth/verify-email').send({ email, code }).expect(200);
  return res.body.accessToken as string;
}

/** Waits for an email sent in the background (forgot-password doesn't wait for the mail). */
export async function waitForMail(mail: FakeMail, to: string, kind: SentMail['kind']) {
  for (let i = 0; i < 50; i++) {
    const m = mail.last(to, kind);
    if (m) return m;
    await new Promise((r) => setTimeout(r, 20));
  }
  return undefined;
}
