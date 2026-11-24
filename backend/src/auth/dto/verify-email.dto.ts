import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, Matches } from 'class-validator';
import { EMAIL_ERROR, normalizeEmail } from './register.dto';

export class VerifyEmailDto {
  @ApiProperty({ example: 'ivan.petrenko.pp.2026@lpnu.ua' })
  @Transform(normalizeEmail)
  @IsEmail({}, { message: EMAIL_ERROR })
  email: string;

  @ApiProperty({ example: '123456', description: 'Код з листа, 6 цифр' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Matches(/^\d{6}$/, { message: 'Код — 6 цифр' })
  code: string;
}
