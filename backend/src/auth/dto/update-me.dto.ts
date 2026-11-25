import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Length, Matches } from 'class-validator';
import { NAME_ERROR } from './register.dto';

export class UpdateMeDto {
  @ApiProperty({ example: 'Іван', minLength: 2, maxLength: 40, description: 'Ті самі правила, що при реєстрації' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Length(2, 40, { message: NAME_ERROR })
  @Matches(/^[\p{L}\s’'-]+$/u, { message: NAME_ERROR })
  name: string;
}
