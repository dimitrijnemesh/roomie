import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HabitsDto, LookingDto } from './update-profile.dto';

export class PhotoDto {
  @ApiProperty({ example: 'cmhx1k2b40000abcd1234efgh' })
  id: string;

  @ApiProperty({ example: 'http://localhost:4000/uploads/3f1c….webp' })
  url: string;
}

export class ProfileDto {
  @ApiProperty({ example: 'cmhx1k2b40000abcd1234efgh' })
  id: string;

  @ApiProperty({ example: 'Іван' })
  name: string;

  @ApiProperty({ example: 'lpnu', description: 'Код університету з домену пошти' })
  university: string;

  @ApiPropertyOptional({ enum: ['male', 'female'] })
  gender: string | null;

  @ApiPropertyOptional({ example: '2007-05-14', description: 'Лише у власній анкеті (/profile/me)' })
  birthDate?: string | null;

  @ApiPropertyOptional({ example: 18, description: 'Рахується з дати народження' })
  age: number | null;

  @ApiPropertyOptional({ enum: ['bachelor', 'master', 'phd'] })
  degree: string | null;

  @ApiPropertyOptional({ example: 'Інститут комп’ютерних наук та інформаційних технологій' })
  faculty: string | null;

  @ApiPropertyOptional({ example: 'Комп’ютерні науки' })
  specialty: string | null;

  @ApiPropertyOptional({ example: 'Системи штучного інтелекту' })
  specialization: string | null;

  @ApiPropertyOptional({ example: 1 })
  course: number | null;

  @ApiPropertyOptional({ example: 'Шукаю спокійного сусіда' })
  bio: string | null;

  @ApiPropertyOptional({ type: HabitsDto })
  habits: HabitsDto | null;

  @ApiPropertyOptional({ type: LookingDto })
  looking: LookingDto | null;

  @ApiProperty({ type: [PhotoDto], description: 'Перше фото — головне' })
  photos: PhotoDto[];

  @ApiProperty({ description: 'Анкета заповнена повністю' })
  onboarded: boolean;
}
