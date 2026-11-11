import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty({ example: 'cmhx1k2b40000abcd1234efgh' })
  id: string;

  @ApiProperty({ example: 'ivan.petrenko.pp.2026@lpnu.ua' })
  email: string;

  @ApiProperty({ example: 'Іван' })
  name: string;

  @ApiProperty({ description: 'Пошта підтверджена' })
  verified: boolean;

  @ApiProperty({ description: 'Анкета заповнена' })
  onboarded: boolean;
}

export class SentDto {
  @ApiProperty({ example: true })
  sent: true;
}

export class AuthResultDto {
  @ApiProperty({ description: 'JWT. Передавати як `Authorization: Bearer <token>`' })
  accessToken: string;

  @ApiProperty({ type: UserDto })
  user: UserDto;
}

export class ApiErrorDto {
  @ApiProperty({ example: { code: 'EMAIL_NOT_STUDENT', message: 'Потрібна студентська пошта львівського університету' } })
  error: { code: string; message: string };
}
