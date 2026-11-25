import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, Matches } from 'class-validator';
import { EMAIL_ERROR, PASSWORD_ERROR, PASSWORD_PATTERN, normalizeEmail } from './register.dto';

export class ResetPasswordDto {
  @ApiProperty({ example: 'ivan.petrenko.pp.2026@lpnu.ua' })
  @Transform(normalizeEmail)
  @IsEmail({}, { message: EMAIL_ERROR })
  email: string;

  @ApiProperty({ example: '123456', description: 'Код з листа «Відновлення пароля», 6 цифр' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Matches(/^\d{6}$/, { message: 'Код — 6 цифр' })
  code: string;

  @ApiProperty({ example: 'roomie2027?', minLength: 8, maxLength: 72, description: 'Ті самі правила, що при реєстрації' })
  @IsString({ message: PASSWORD_ERROR })
  @Length(8, 72, { message: PASSWORD_ERROR })
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_ERROR })
  newPassword: string;
}
