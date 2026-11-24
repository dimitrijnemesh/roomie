import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail } from 'class-validator';
import { EMAIL_ERROR, normalizeEmail } from './register.dto';

export class ResendCodeDto {
  @ApiProperty({ example: 'ivan.petrenko.pp.2026@lpnu.ua' })
  @Transform(normalizeEmail)
  @IsEmail({}, { message: EMAIL_ERROR })
  email: string;
}
