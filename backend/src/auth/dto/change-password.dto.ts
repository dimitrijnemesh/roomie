import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';
import { PASSWORD_ERROR, PASSWORD_PATTERN } from './register.dto';

export class ChangePasswordDto {
  @ApiProperty({ example: 'roomie2026!' })
  @IsString({ message: 'Введи поточний пароль' })
  @Length(1, 72, { message: 'Введи поточний пароль' })
  currentPassword: string;

  @ApiProperty({
    example: 'roomie2027?',
    minLength: 8,
    maxLength: 72,
    description: 'Ті самі правила, що при реєстрації, і не такий самий, як поточний',
  })
  @IsString({ message: PASSWORD_ERROR })
  @Length(8, 72, { message: PASSWORD_ERROR })
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_ERROR })
  newPassword: string;
}
