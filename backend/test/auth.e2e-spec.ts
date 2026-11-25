import { INestApplication } from '@nestjs/common';
import { existsSync, readdirSync } from 'fs';
import sharp from 'sharp';
import { PrismaService } from '../src/prisma/prisma.service';
import { createApp, FakeMail, PASSWORD, signUp, waitForMail } from './helpers';

const EMAIL = 'ivan.petrenko.pp.2026@lpnu.ua';
const NEW_PASSWORD = 'roomie2027?';

describe('Авторизація і акаунт (e2e)', () => {
  let app: INestApplication;
  let mail: FakeMail;
  let prisma: PrismaService;
  let http: Awaited<ReturnType<typeof createApp>>['http'];

  beforeEach(async () => {
    ({ app, mail, prisma, http } = await createApp());
  });

  afterEach(async () => {
    await app.close();
  });

  const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

  describe('реєстрація і вхід', () => {
    it('реєстрація → код → вхід → /auth/me', async () => {
      await signUp(app, mail, EMAIL);

      const login = await http().post('/auth/login').send({ email: EMAIL, password: PASSWORD }).expect(200);
      const me = await http().get('/auth/me').set(bearer(login.body.accessToken)).expect(200);

      expect(me.body).toMatchObject({ email: EMAIL, name: 'Іван', verified: true, onboarded: false });
    });

    it('неіснуюча пошта і неправильний пароль дають одну й ту саму помилку', async () => {
      await signUp(app, mail, EMAIL);

      const wrongPassword = await http().post('/auth/login').send({ email: EMAIL, password: 'wrong-pass1!' }).expect(401);
      const noSuchUser = await http()
        .post('/auth/login')
        .send({ email: 'nobody.pp.2026@lpnu.ua', password: PASSWORD })
        .expect(401);

      expect(wrongPassword.body).toEqual(noSuchUser.body);
      expect(wrongPassword.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('підроблений токен не пускає', async () => {
      const res = await http().get('/auth/me').set(bearer('not.a.real.token')).expect(401);
      expect(res.body.error.code).toBe('TOKEN_INVALID');
    });

    it('після 10 спроб входу за хвилину — 429', async () => {
      const attempt = () => http().post('/auth/login').send({ email: EMAIL, password: 'wrong-pass1!' });
      for (let i = 0; i < 10; i++) await attempt().expect(401);
      await attempt().expect(429);
    });
  });

  describe('зміна пароля (KAN-39)', () => {
    it('старий токен і старий пароль більше не працюють', async () => {
      const oldToken = await signUp(app, mail, EMAIL);

      const res = await http()
        .post('/auth/change-password')
        .set(bearer(oldToken))
        .send({ currentPassword: PASSWORD, newPassword: NEW_PASSWORD })
        .expect(200);

      await http().get('/auth/me').set(bearer(oldToken)).expect(401);
      await http().get('/auth/me').set(bearer(res.body.accessToken)).expect(200);
      await http().post('/auth/login').send({ email: EMAIL, password: PASSWORD }).expect(401);
      await http().post('/auth/login').send({ email: EMAIL, password: NEW_PASSWORD }).expect(200);
    });

    it('неправильний поточний пароль — WRONG_PASSWORD', async () => {
      const token = await signUp(app, mail, EMAIL);
      const res = await http()
        .post('/auth/change-password')
        .set(bearer(token))
        .send({ currentPassword: 'wrong-pass1!', newPassword: NEW_PASSWORD })
        .expect(400);
      expect(res.body.error).toMatchObject({ code: 'WRONG_PASSWORD', field: 'currentPassword' });
    });
  });

  describe('відновлення пароля (KAN-40)', () => {
    it('однакова відповідь для зареєстрованої і незнайомої пошти', async () => {
      await signUp(app, mail, EMAIL);

      const known = await http().post('/auth/forgot-password').send({ email: EMAIL }).expect(200);
      const unknown = await http().post('/auth/forgot-password').send({ email: 'nobody.pp.2026@lpnu.ua' }).expect(200);

      expect(known.body).toEqual({ sent: true });
      expect(unknown.body).toEqual({ sent: true });
      expect(await waitForMail(mail, EMAIL, 'reset')).toBeDefined();
      expect(mail.sent.some((m) => m.to === 'nobody.pp.2026@lpnu.ua')).toBe(false);
    });

    it('код з листа → новий пароль; старі токени і старий пароль не працюють', async () => {
      const oldToken = await signUp(app, mail, EMAIL);
      await http().post('/auth/forgot-password').send({ email: EMAIL }).expect(200);
      const { code } = (await waitForMail(mail, EMAIL, 'reset'))!;

      const res = await http()
        .post('/auth/reset-password')
        .send({ email: EMAIL, code, newPassword: NEW_PASSWORD })
        .expect(200);

      expect(res.body.user.email).toBe(EMAIL);
      await http().get('/auth/me').set(bearer(oldToken)).expect(401);
      await http().get('/auth/me').set(bearer(res.body.accessToken)).expect(200);
      await http().post('/auth/login').send({ email: EMAIL, password: PASSWORD }).expect(401);
      await http().post('/auth/login').send({ email: EMAIL, password: NEW_PASSWORD }).expect(200);
    });

    it('неправильний код — CODE_INVALID, після 5 спроб — TOO_MANY_ATTEMPTS', async () => {
      await signUp(app, mail, EMAIL);
      await http().post('/auth/forgot-password').send({ email: EMAIL }).expect(200);
      const { code } = (await waitForMail(mail, EMAIL, 'reset'))!;
      const wrong = code === '000000' ? '111111' : '000000';

      for (let i = 0; i < 5; i++) {
        const res = await http()
          .post('/auth/reset-password')
          .send({ email: EMAIL, code: wrong, newPassword: NEW_PASSWORD })
          .expect(400);
        expect(res.body.error.code).toBe('CODE_INVALID');
      }
      // Even the right code no longer works — a new one is needed.
      const blocked = await http()
        .post('/auth/reset-password')
        .send({ email: EMAIL, code, newPassword: NEW_PASSWORD })
        .expect(429);
      expect(blocked.body.error.code).toBe('TOO_MANY_ATTEMPTS');
    });

    it('код реєстрації не підходить для зміни пароля', async () => {
      await http().post('/auth/register').send({ email: EMAIL, password: PASSWORD, name: 'Іван' }).expect(201);
      const signUpCode = mail.last(EMAIL, 'verify')!.code;

      const res = await http()
        .post('/auth/reset-password')
        .send({ email: EMAIL, code: signUpCode, newPassword: NEW_PASSWORD })
        .expect(400);
      expect(res.body.error.code).toBe('CODE_INVALID');
    });

    it('слабкий новий пароль — WEAK_PASSWORD', async () => {
      await signUp(app, mail, EMAIL);
      await http().post('/auth/forgot-password').send({ email: EMAIL }).expect(200);
      const { code } = (await waitForMail(mail, EMAIL, 'reset'))!;

      const res = await http()
        .post('/auth/reset-password')
        .send({ email: EMAIL, code, newPassword: '12345678' })
        .expect(400);
      expect(res.body.error).toMatchObject({ code: 'WEAK_PASSWORD', field: 'newPassword' });
    });
  });

  describe('ім’я і видалення акаунта (KAN-41)', () => {
    it('PATCH /auth/me змінює ім’я', async () => {
      const token = await signUp(app, mail, EMAIL);

      const res = await http().patch('/auth/me').set(bearer(token)).send({ name: '  Олена  ' }).expect(200);
      expect(res.body.name).toBe('Олена');

      const bad = await http().patch('/auth/me').set(bearer(token)).send({ name: 'A1' }).expect(400);
      expect(bad.body.error.code).toBe('INVALID_NAME');
    });

    it('видалення з неправильним паролем — WRONG_PASSWORD, акаунт лишається', async () => {
      const token = await signUp(app, mail, EMAIL);

      const res = await http().delete('/auth/me').set(bearer(token)).send({ password: 'wrong-pass1!' }).expect(400);
      expect(res.body.error).toMatchObject({ code: 'WRONG_PASSWORD', field: 'password' });
      await http().get('/auth/me').set(bearer(token)).expect(200);
    });

    it('видаляє користувача, анкету, фото (і файли), коди; пошту можна зареєструвати знову', async () => {
      const token = await signUp(app, mail, EMAIL);
      await http().put('/profile/me').set(bearer(token)).send({ gender: 'male' }).expect(200);

      const image = await sharp({ create: { width: 40, height: 40, channels: 3, background: '#3CCB98' } }).png().toBuffer();
      await http().post('/profile/me/photos').set(bearer(token)).attach('photo', image, 'me.png').expect(201);
      const uploadDir = process.env.UPLOAD_DIR!;
      expect(readdirSync(uploadDir)).toHaveLength(1);
      const file = readdirSync(uploadDir)[0];

      await http().post('/auth/forgot-password').send({ email: EMAIL }).expect(200);
      await waitForMail(mail, EMAIL, 'reset');

      const res = await http().delete('/auth/me').set(bearer(token)).send({ password: PASSWORD }).expect(200);
      expect(res.body).toEqual({ deleted: true });

      expect(await prisma.user.count()).toBe(0);
      expect(await prisma.profile.count()).toBe(0);
      expect(await prisma.photo.count()).toBe(0);
      expect(await prisma.emailCode.count()).toBe(0);
      expect(existsSync(`${uploadDir}/${file}`)).toBe(false);

      await http().get('/auth/me').set(bearer(token)).expect(401);
      await signUp(app, mail, EMAIL);
    });
  });
});
