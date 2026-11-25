import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class DeleteAccountDto {
  @ApiProperty({ example: 'roomie2026!', description: 'Поточний пароль — підтвердження видалення' })
  @IsString({ message: 'Введи пароль' })
  @Length(1, 72, { message: 'Введи пароль' })
  password: string;
}
