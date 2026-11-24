import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsString } from 'class-validator';

export class ReorderPhotosDto {
  @ApiProperty({ example: ['ph_2', 'ph_1'], description: 'Усі id фото в новому порядку; перше — головне' })
  @IsArray({ message: 'Передай список id фото' })
  @ArrayMaxSize(4, { message: 'Максимум 4 фото' })
  @IsString({ each: true, message: 'Передай список id фото' })
  ids: string[];
}
