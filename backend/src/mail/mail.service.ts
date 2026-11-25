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
    await this.sendCode(to, {
      subject: `${code} — твій код для Roomie`,
      greeting: `Привіт, ${name}!`,
      lead: 'Твій код підтвердження:',
      footer: 'Код діє 10 хвилин. Якщо ти не реєструвався в Roomie — просто проігноруй цей лист.',
      code,
      name,
    });
  }

  async sendPasswordResetCode(to: string, name: string, code: string) {
    await this.sendCode(to, {
      subject: `${code} — відновлення пароля Roomie`,
      greeting: `Привіт, ${name}!`,
      lead: 'Хтось (сподіваємось, ти) хоче змінити пароль у Roomie. Твій код:',
      footer: 'Код діє 10 хвилин. Якщо ти не просив змінити пароль — просто проігноруй цей лист, пароль залишиться старим.',
      code,
      name,
    });
  }

  private async sendCode(
    to: string,
    m: { subject: string; greeting: string; lead: string; footer: string; code: string; name: string },
  ) {
    if (!this.transport) {
      this.logger.warn(`SMTP не налаштовано. ${m.subject} → ${to}`);
      return;
    }

    await this.transport.sendMail({
      from: this.from,
      to,
      subject: m.subject,
      text: `${m.greeting}\n\n${m.lead} ${m.code}\n\n${m.footer}`,
      html: `
        <div style="font-family:Rubik,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;color:#12302A">
          <h1 style="font-size:28px;margin:0 0 16px">Roomie<span style="color:#3CCB98">.</span></h1>
          <p style="font-size:16px;color:#3D5A52">Привіт, ${escapeHtml(m.name)}!</p>
          <p style="font-size:16px;color:#3D5A52">${m.lead}</p>
          <div style="background:#E8F7F1;border-radius:24px;padding:24px;text-align:center;font-size:36px;font-weight:700;letter-spacing:8px">${m.code}</div>
          <p style="font-size:14px;color:#5E7A72;margin-top:24px">${m.footer}</p>
        </div>`,
    });
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
