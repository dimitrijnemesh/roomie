import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export const SLEEP = ['early', 'late', 'flexible'] as const;
export const GUESTS = ['never', 'rarely', 'often'] as const;
export const HOUSING = ['dorm', 'flat', 'any'] as const;

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
  @ApiPropertyOptional({ example: [2000, 4000], description: 'Бюджет, грн/міс: [від, до]' })
  @IsOptional()
  @ArrayMinSize(2, { message: 'Бюджет — два числа: від і до' })
  @ArrayMaxSize(2, { message: 'Бюджет — два числа: від і до' })
  @IsInt({ each: true, message: 'Бюджет — цілі числа' })
  @Min(0, { each: true, message: 'Бюджет не може бути від’ємним' })
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
  @ApiPropertyOptional({ example: 18, minimum: 16, maximum: 60 })
  @IsOptional()
  @IsInt({ message: 'Вік — число від 16 до 60' })
  @Min(16, { message: 'Вік — число від 16 до 60' })
  @Max(60, { message: 'Вік — число від 16 до 60' })
  age?: number;

  @ApiPropertyOptional({ example: 'ІКНІ', maxLength: 60 })
  @IsOptional()
  @Transform(trim)
  @IsString({ message: 'Інститут — текст' })
  @Length(2, 60, { message: 'Інститут — від 2 до 60 символів' })
  institute?: string;

  @ApiPropertyOptional({ example: 1, minimum: 1, maximum: 6 })
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
