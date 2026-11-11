import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { ApiException } from '../common/exceptions/api.exception';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResultDto, UserDto } from './dto/responses.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

const CODE_TTL_MS = 10 * 60 * 1000;
const CODE_MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;
const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
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

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = existing
      ? await this.prisma.user.update({ where: { id: existing.id }, data: { passwordHash, name: dto.name } })
      : await this.prisma.user.create({ data: { email: dto.email, passwordHash, name: dto.name } });

    await this.issueCode(user);
    return { sent: true };
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<AuthResultDto> {
    const record = await this.prisma.emailCode.findUnique({ where: { email: dto.email } });
    if (!record) throw new ApiException(400, 'CODE_INVALID', 'Невірний код');
    if (record.expiresAt < new Date()) throw new ApiException(400, 'CODE_EXPIRED', 'Код прострочений — надішли новий');
    if (record.attempts >= CODE_MAX_ATTEMPTS) {
      throw new ApiException(429, 'TOO_MANY_ATTEMPTS', 'Забагато спроб — надішли новий код');
    }

    const ok = await bcrypt.compare(dto.code, record.codeHash);
    if (!ok) {
      await this.prisma.emailCode.update({ where: { email: dto.email }, data: { attempts: { increment: 1 } } });
      throw new ApiException(400, 'CODE_INVALID', 'Невірний код');
    }

    const [user] = await this.prisma.$transaction([
      this.prisma.user.update({ where: { email: dto.email }, data: { verified: true } }),
      this.prisma.emailCode.delete({ where: { email: dto.email } }),
    ]);

    return this.authResult(user);
  }

  async resendCode(email: string): Promise<{ sent: true }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new ApiException(404, 'USER_NOT_FOUND', 'Такої пошти немає — зареєструйся');
    if (user.verified) throw new ApiException(400, 'ALREADY_VERIFIED', 'Пошта вже підтверджена — увійди');

    const last = await this.prisma.emailCode.findUnique({ where: { email } });
    if (last && Date.now() - last.createdAt.getTime() < RESEND_COOLDOWN_MS) {
      throw new ApiException(429, 'RESEND_TOO_SOON', 'Зачекай хвилину перед повторною відправкою');
    }

    await this.issueCode(user);
    return { sent: true };
  }

  async login(dto: LoginDto): Promise<AuthResultDto> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    const ok = user && (await bcrypt.compare(dto.password, user.passwordHash));
    if (!ok) throw new ApiException(401, 'INVALID_CREDENTIALS', 'Невірна пошта або пароль');
    if (!user.verified) throw new ApiException(403, 'EMAIL_NOT_VERIFIED', 'Спочатку підтверди пошту');

    return this.authResult(user);
  }

  toUserDto(user: User): UserDto {
    const { id, email, name, verified, onboarded } = user;
    return { id, email, name, verified, onboarded };
  }

  private async issueCode(user: User) {
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const codeHash = await bcrypt.hash(code, BCRYPT_ROUNDS);
    const data = { codeHash, expiresAt: new Date(Date.now() + CODE_TTL_MS), attempts: 0, createdAt: new Date() };

    await this.prisma.emailCode.upsert({
      where: { email: user.email },
      create: { email: user.email, ...data },
      update: data,
    });
    await this.mail.sendVerificationCode(user.email, user.name, code);
  }

  private async authResult(user: User): Promise<AuthResultDto> {
    const accessToken = await this.jwt.signAsync({ sub: user.id });
    return { accessToken, user: this.toUserDto(user) };
  }
}
