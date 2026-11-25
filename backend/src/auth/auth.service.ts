import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { ApiException } from '../common/exceptions/api.exception';
import { MailService } from '../mail/mail.service';
import { removeFile } from '../profile/photos.storage';
import { PrismaService } from '../prisma/prisma.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthResultDto, UserDto } from './dto/responses.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

const CODE_TTL_MS = 10 * 60 * 1000;
const CODE_MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;
const BCRYPT_ROUNDS = 10;
const DUMMY_HASH = bcrypt.hashSync('roomie-timing-dummy', BCRYPT_ROUNDS);

/** verify — sign-up code; reset — forgotten-password code. */
type CodePurpose = 'verify' | 'reset';
const codeKey = (email: string, purpose: CodePurpose) => ({ email_purpose: { email, purpose } });

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
  ) {}

  async register(dto: RegisterDto): Promise<{ sent: true }> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing?.verified) {
      throw new ApiException(409, 'EMAIL_TAKEN', 'Ця пошта вже зареєстрована — спробуй увійти');
    }

    // Re-registering an unconfirmed email re-sends the code — same 60 s cooldown as resend-code,
    // otherwise anyone could flood someone's inbox.
    if (existing) await this.assertResendAllowed(existing.email, 'verify');

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = existing
      ? await this.prisma.user.update({ where: { id: existing.id }, data: { passwordHash, name: dto.name } })
      : await this.prisma.user.create({ data: { email: dto.email, passwordHash, name: dto.name } });

    await this.issueCode(user, 'verify');
    return { sent: true };
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<AuthResultDto> {
    await this.checkCode(dto.email, 'verify', dto.code);

    const [user] = await this.prisma.$transaction([
      this.prisma.user.update({ where: { email: dto.email }, data: { verified: true } }),
      this.prisma.emailCode.delete({ where: codeKey(dto.email, 'verify') }),
    ]);

    return this.authResult(user);
  }

  async resendCode(email: string): Promise<{ sent: true }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new ApiException(404, 'USER_NOT_FOUND', 'Такої пошти немає — зареєструйся');
    if (user.verified) throw new ApiException(400, 'ALREADY_VERIFIED', 'Пошта вже підтверджена — увійди');

    await this.assertResendAllowed(email, 'verify');
    await this.issueCode(user, 'verify');
    return { sent: true };
  }

  async login(dto: LoginDto): Promise<AuthResultDto> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    // One answer for "no such account" and "wrong password", and a bcrypt check in both cases,
    // so neither the message nor the response time tells whether an email is registered.
    const ok = await bcrypt.compare(dto.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok) throw new ApiException(401, 'INVALID_CREDENTIALS', 'Невірна пошта або пароль');
    if (!user.verified) throw new ApiException(403, 'EMAIL_NOT_VERIFIED', 'Спочатку підтверди пошту');

    return this.authResult(user);
  }

  async changePassword(user: User, dto: ChangePasswordDto): Promise<AuthResultDto> {
    const ok = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!ok) throw new ApiException(400, 'WRONG_PASSWORD', 'Поточний пароль неправильний', 'currentPassword');
    if (await bcrypt.compare(dto.newPassword, user.passwordHash)) {
      throw new ApiException(400, 'SAME_PASSWORD', 'Новий пароль має відрізнятися від поточного', 'newPassword');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    // Conditional on the version the guard saw, so two parallel changes can't both succeed.
    const { count } = await this.prisma.user.updateMany({
      where: { id: user.id, tokenVersion: user.tokenVersion },
      data: { passwordHash, tokenVersion: { increment: 1 } },
    });
    if (count === 0) throw new ApiException(401, 'TOKEN_INVALID', 'Сесія закінчилась, увійди знову');

    const updated = await this.prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    return this.authResult(updated);
  }

  /**
   * Always the same answer, whether the email is registered or not, so nobody can check
   * who uses Roomie. The email is sent in the background so the response time doesn't tell either.
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<{ sent: true }> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user?.verified) return { sent: true };

    const last = await this.prisma.emailCode.findUnique({ where: codeKey(user.email, 'reset') });
    if (last && Date.now() - last.createdAt.getTime() < RESEND_COOLDOWN_MS) return { sent: true };

    this.issueCode(user, 'reset').catch((e) => this.logger.error(`Лист відновлення не надіслано: ${e}`));
    return { sent: true };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<AuthResultDto> {
    await this.checkCode(dto.email, 'reset', dto.code);

    const passwordHash = await bcrypt.hash(dto.newPassword, BCRYPT_ROUNDS);
    // New password and a new token version: every device that was logged in gets logged out.
    const [user] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { email: dto.email },
        data: { passwordHash, tokenVersion: { increment: 1 } },
      }),
      this.prisma.emailCode.delete({ where: codeKey(dto.email, 'reset') }),
    ]);

    return this.authResult(user);
  }

  async updateMe(user: User, dto: UpdateMeDto): Promise<UserDto> {
    const updated = await this.prisma.user.update({ where: { id: user.id }, data: { name: dto.name } });
    return this.toUserDto(updated);
  }

  /** Deletes the user and everything about them: profile and photos (rows and files), codes. */
  async deleteAccount(user: User, dto: DeleteAccountDto): Promise<{ deleted: true }> {
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new ApiException(400, 'WRONG_PASSWORD', 'Пароль неправильний', 'password');

    const photos = await this.prisma.photo.findMany({ where: { userId: user.id }, select: { file: true } });
    await this.prisma.$transaction([
      this.prisma.emailCode.deleteMany({ where: { email: user.email } }),
      // Profile and photo rows go with the user (onDelete: Cascade).
      this.prisma.user.delete({ where: { id: user.id } }),
    ]);
    await Promise.all(photos.map((p) => removeFile(p.file)));

    return { deleted: true };
  }

  /** Same rules for every code: 10 minutes, 5 attempts, only the hash is stored. */
  private async checkCode(email: string, purpose: CodePurpose, code: string) {
    const record = await this.prisma.emailCode.findUnique({ where: codeKey(email, purpose) });
    if (!record) throw new ApiException(400, 'CODE_INVALID', 'Код неправильний — перевір і спробуй ще раз', 'code');
    if (record.expiresAt < new Date()) {
      throw new ApiException(400, 'CODE_EXPIRED', 'Код прострочений — надішли новий', 'code');
    }
    if (record.attempts >= CODE_MAX_ATTEMPTS) {
      throw new ApiException(429, 'TOO_MANY_ATTEMPTS', 'Забагато спроб — надішли новий код', 'code');
    }

    if (!(await bcrypt.compare(code, record.codeHash))) {
      await this.prisma.emailCode.update({ where: codeKey(email, purpose), data: { attempts: { increment: 1 } } });
      throw new ApiException(400, 'CODE_INVALID', 'Код неправильний — перевір і спробуй ще раз', 'code');
    }
  }

  private async assertResendAllowed(email: string, purpose: CodePurpose) {
    const last = await this.prisma.emailCode.findUnique({ where: codeKey(email, purpose) });
    if (last && Date.now() - last.createdAt.getTime() < RESEND_COOLDOWN_MS) {
      throw new ApiException(429, 'RESEND_TOO_SOON', 'Зачекай хвилину перед повторною відправкою');
    }
  }

  toUserDto(user: User): UserDto {
    const { id, email, name, verified, onboarded } = user;
    return { id, email, name, verified, onboarded };
  }

  private async issueCode(user: User, purpose: CodePurpose) {
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const codeHash = await bcrypt.hash(code, BCRYPT_ROUNDS);
    const data = { codeHash, expiresAt: new Date(Date.now() + CODE_TTL_MS), attempts: 0, createdAt: new Date() };

    await this.prisma.emailCode.upsert({
      where: codeKey(user.email, purpose),
      create: { email: user.email, purpose, ...data },
      update: data,
    });

    if (purpose === 'reset') await this.mail.sendPasswordResetCode(user.email, user.name, code);
    else await this.mail.sendVerificationCode(user.email, user.name, code);
  }

  private async authResult(user: User): Promise<AuthResultDto> {
    const accessToken = await this.jwt.signAsync({ sub: user.id, ver: user.tokenVersion });
    return { accessToken, user: this.toUserDto(user) };
  }
}

