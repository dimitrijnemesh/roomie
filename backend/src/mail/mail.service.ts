import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transport: nodemailer.Transporter | null;
  private readonly from: string;

  constructor(config: ConfigService) {
    const user = config.get<string>('SMTP_USER');
    this.from = config.get<string>('MAIL_FROM') ?? 'Roomie <roomie.ua@gmail.com>';
    this.transport = user
      ? nodemailer.createTransport({
          host: config.get<string>('SMTP_HOST') ?? 'smtp.gmail.com',
          port: Number(config.get('SMTP_PORT') ?? 465),
          secure: Number(config.get('SMTP_PORT') ?? 465) === 465,
          auth: { user, pass: config.get<string>('SMTP_PASS') },
        })
      : null;
  }

  async sendVerificationCode(to: string, name: string, code: string) {
    if (!this.transport) {
      this.logger.warn(`SMTP не налаштовано. Код для ${to}: ${code}`);
      return;
    }

    await this.transport.sendMail({
      from: this.from,
      to,
      subject: `${code} — твій код для Roomie`,
      text: `Привіт, ${name}!\n\nТвій код підтвердження: ${code}\nВін діє 10 хвилин.\n\nЯкщо ти не реєструвався в Roomie — просто проігноруй цей лист.`,
      html: `
        <div style="font-family:Rubik,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;color:#12302A">
          <h1 style="font-size:28px;margin:0 0 16px">Roomie<span style="color:#3CCB98">.</span></h1>
          <p style="font-size:16px;color:#3D5A52">Привіт, ${escapeHtml(name)}!</p>
          <p style="font-size:16px;color:#3D5A52">Твій код підтвердження:</p>
          <div style="background:#E8F7F1;border-radius:24px;padding:24px;text-align:center;font-size:36px;font-weight:700;letter-spacing:8px">${code}</div>
          <p style="font-size:14px;color:#5E7A72;margin-top:24px">Код діє 10 хвилин. Якщо ти не реєструвався в Roomie — просто проігноруй цей лист.</p>
        </div>`,
    });
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
