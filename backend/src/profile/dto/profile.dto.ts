import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HabitsDto, LookingDto } from './update-profile.dto';

export class ProfileDto {
  @ApiProperty({ example: 'cmhx1k2b40000abcd1234efgh' })
  id: string;

  @ApiProperty({ example: 'Іван' })
  name: string;

  @ApiProperty({ example: 'lpnu', description: 'Код університету з домену пошти' })
  university: string;

  @ApiPropertyOptional({ example: 18 })
  age: number | null;

  @ApiPropertyOptional({ example: 'ІКНІ' })
  institute: string | null;

  @ApiPropertyOptional({ example: 1 })
  course: number | null;

  @ApiPropertyOptional({ example: 'Шукаю спокійного сусіда' })
  bio: string | null;

  @ApiPropertyOptional({ type: HabitsDto })
  habits: HabitsDto | null;

  @ApiPropertyOptional({ type: LookingDto })
  looking: LookingDto | null;

  @ApiProperty({ description: 'Анкета заповнена повністю' })
  onboarded: boolean;
}
