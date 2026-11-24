import { ApiPropertyOptional } from '@nestjs/swagger';
import { DEGREES, type Degree } from '../../config/academics';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export const SLEEP = ['early', 'late', 'flexible'] as const;
export const GUESTS = ['never', 'rarely', 'often'] as const;
export const HOUSING = ['dorm', 'flat', 'any'] as const;
export const GENDER = ['male', 'female'] as const;
export const ROOMMATE_GENDER = ['male', 'female', 'any'] as const;

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class HabitsDto {
  @ApiPropertyOptional({ enum: SLEEP, description: 'Коли лягаєш спати' })
  @IsOptional()
  @IsIn(SLEEP, { message: 'Обери: early, late або flexible' })
  sleep?: (typeof SLEEP)[number];

  @ApiPropertyOptional({ minimum: 1, maximum: 5, description: 'Наскільки важлива чистота, 1–5' })
  @IsOptional()
  @IsInt({ message: 'Чистота — число від 1 до 5' })
  @Min(1, { message: 'Чистота — число від 1 до 5' })
  @Max(5, { message: 'Чистота — число від 1 до 5' })
  clean?: number;

  @ApiPropertyOptional({ description: 'Чи куриш' })
  @IsOptional()
  @IsBoolean({ message: 'Куріння — так або ні' })
  smoking?: boolean;

  @ApiPropertyOptional({ enum: GUESTS, description: 'Як часто гості' })
  @IsOptional()
  @IsIn(GUESTS, { message: 'Обери: never, rarely або often' })
  guests?: (typeof GUESTS)[number];
}

export class LookingDto {
  @ApiPropertyOptional({ enum: ROOMMATE_GENDER, description: 'Кого шукаєш у сусіди' })
  @IsOptional()
  @IsIn(ROOMMATE_GENDER, { message: 'Обери: male, female або any' })
  roommateGender?: (typeof ROOMMATE_GENDER)[number];

  @ApiPropertyOptional({ example: [2000, 4000], description: 'Бюджет, грн/міс: [від, до]' })
  @IsOptional()
  @ArrayMinSize(2, { message: 'Бюджет — два числа: від і до' })
  @ArrayMaxSize(2, { message: 'Бюджет — два числа: від і до' })
  @IsInt({ each: true, message: 'Бюджет — цілі числа' })
  @Min(0, { each: true, message: 'Бюджет не може бути від’ємним' })
  @Max(100_000, { each: true, message: 'Бюджет — до 100 000 грн' })
  budget?: [number, number];

  @ApiPropertyOptional({ enum: HOUSING, description: 'Тип житла' })
  @IsOptional()
  @IsIn(HOUSING, { message: 'Обери: dorm, flat або any' })
  housing?: (typeof HOUSING)[number];

  @ApiPropertyOptional({ example: 'Сихів', maxLength: 60 })
  @IsOptional()
  @Transform(trim)
  @IsString({ message: 'Район — текст' })
  @Length(0, 60, { message: 'Район — до 60 символів' })
  district?: string;
}

export class UpdateProfileDto {
  @ApiPropertyOptional({ enum: GENDER })
  @IsOptional()
  @IsIn(GENDER, { message: 'Обери: male або female' })
  gender?: (typeof GENDER)[number];

  @ApiPropertyOptional({ example: '2007-05-14', description: 'Дата народження, YYYY-MM-DD. Вік 16–60 рахується з неї.' })
  @IsOptional()
  @IsString({ message: 'Вкажи дату народження' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Дата народження — у форматі РРРР-ММ-ДД' })
  birthDate?: string;

  @ApiPropertyOptional({ enum: DEGREES, description: 'Освітній ступінь' })
  @IsOptional()
  @IsIn(DEGREES, { message: 'Обери: bachelor, master або phd' })
  degree?: Degree;

  @ApiPropertyOptional({ example: 'Інститут комп’ютерних наук та інформаційних технологій', description: 'Назва зі списку твого вишу' })
  @IsOptional()
  @Transform(trim)
  @IsString({ message: 'Обери факультет зі списку' })
  @Length(2, 120, { message: 'Обери факультет зі списку' })
  faculty?: string;

  @ApiPropertyOptional({ example: 'Комп’ютерні науки', description: 'Назва зі списку спеціальностей факультету' })
  @IsOptional()
  @Transform(trim)
  @IsString({ message: 'Обери спеціальність зі списку' })
  @Length(2, 120, { message: 'Обери спеціальність зі списку' })
  specialty?: string;

  @ApiPropertyOptional({ example: 'Системи штучного інтелекту', description: 'Освітня програма: зі списку або своя; порожній рядок — прибрати' })
  @IsOptional()
  @Transform(trim)
  @IsString({ message: 'Спеціалізація — текст' })
  @Length(0, 120, { message: 'Спеціалізація — до 120 символів' })
  specialization?: string;

  @ApiPropertyOptional({ example: 1, minimum: 1, maximum: 6, description: 'Бакалавр 1–4, магістр 1–2 (ЛНМУ 1–6), PhD 1–4' })
  @IsOptional()
  @IsInt({ message: 'Курс — число від 1 до 6' })
  @Min(1, { message: 'Курс — число від 1 до 6' })
  @Max(6, { message: 'Курс — число від 1 до 6' })
  course?: number;

  @ApiPropertyOptional({ example: 'Шукаю спокійного сусіда, люблю готувати', maxLength: 300 })
  @IsOptional()
  @Transform(trim)
  @IsString({ message: 'Про себе — текст' })
  @Length(0, 300, { message: 'Про себе — до 300 символів' })
  bio?: string;

  @ApiPropertyOptional({ type: HabitsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => HabitsDto)
  habits?: HabitsDto;

  @ApiPropertyOptional({ type: LookingDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => LookingDto)
  looking?: LookingDto;
}
