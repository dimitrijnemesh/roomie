import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length } from 'class-validator';
import { EMAIL_ERROR, normalizeEmail } from './register.dto';

export class LoginDto {
  @ApiProperty({ example: 'ivan.petrenko.pp.2026@lpnu.ua' })
  @Transform(normalizeEmail)
  @IsEmail({}, { message: EMAIL_ERROR })
  email: string;

  @ApiProperty({ example: 'roomie2026' })
  @IsString({ message: 'Введи пароль' })
  @Length(1, 72, { message: 'Введи пароль' })
  password: string;
}
