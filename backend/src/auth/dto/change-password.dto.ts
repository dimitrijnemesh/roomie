import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'roomie2026!' })
  @IsString({ message: 'Введи поточний пароль' })
  @Length(1, 72, { message: 'Введи поточний пароль' })
  currentPassword: string;

  @ApiProperty({ example: 'roomie2027?' })
  @IsString({ message: 'Введи новий пароль' })
  @Length(1, 72, { message: 'Введи новий пароль' })
  newPassword: string;
}
