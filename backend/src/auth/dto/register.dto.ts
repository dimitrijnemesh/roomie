import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, Length, Matches } from 'class-validator';
import { IsStudentEmail } from '../../common/validators/is-student-email';

export const EMAIL_ERROR = 'Потрібна студентська пошта львівського університету';
export const PASSWORD_ERROR = 'Мінімум 8 символів, літера і цифра';
export const NAME_ERROR = 'Ім’я — від 2 до 40 літер';

export const normalizeEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class RegisterDto {
  @ApiProperty({ example: 'ivan.petrenko.pp.2026@lpnu.ua', description: 'Пошта львівського університету' })
  @Transform(normalizeEmail)
  @IsEmail({}, { message: EMAIL_ERROR })
  @Length(1, 254, { message: EMAIL_ERROR })
  @IsStudentEmail({ message: EMAIL_ERROR })
  email: string;

  @ApiProperty({ example: 'roomie2026', minLength: 8, maxLength: 72, description: 'Мінімум 8 символів, літера і цифра' })
  @Length(8, 72, { message: PASSWORD_ERROR })
  @Matches(/^(?=.*\p{L})(?=.*\d).+$/u, { message: PASSWORD_ERROR })
  password: string;

  @ApiProperty({ example: 'Іван', minLength: 2, maxLength: 40 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Length(2, 40, { message: NAME_ERROR })
  @Matches(/^[\p{L}\s’'-]+$/u, { message: NAME_ERROR })
  name: string;
}
