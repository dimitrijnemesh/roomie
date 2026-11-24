import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { ApiErrorDto } from '../auth/dto/responses.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ProfileDto } from './dto/profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';

@ApiTags('profile')
@ApiBearerAuth()
@Controller()
export class ProfileController {
  constructor(private readonly profile: ProfileService) {}

  @Get('profile/me')
  @ApiOperation({ summary: 'Моя анкета' })
  @ApiResponse({ status: 200, type: ProfileDto })
  @ApiResponse({ status: 401, type: ApiErrorDto })
  getMine(@CurrentUser() user: User) {
    return this.profile.getMine(user);
  }

  @Put('profile/me')
  @ApiOperation({
    summary: 'Заповнити / оновити анкету',
    description: 'Можна надсилати частину полів. Коли заповнені вік, інститут, курс, звички і «що шукаю» — `onboarded` стає `true`.',
  })
  @ApiResponse({ status: 200, type: ProfileDto })
  @ApiResponse({ status: 400, type: ApiErrorDto, description: 'VALIDATION_ERROR' })
  @ApiResponse({ status: 401, type: ApiErrorDto })
  updateMine(@CurrentUser() user: User, @Body() dto: UpdateProfileDto) {
    return this.profile.updateMine(user, dto);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Публічна анкета іншого студента', description: 'Без пошти. Лише заповнені анкети.' })
  @ApiResponse({ status: 200, type: ProfileDto })
  @ApiResponse({ status: 404, type: ApiErrorDto, description: 'USER_NOT_FOUND' })
  getPublic(@Param('id') id: string) {
    return this.profile.getPublic(id);
  }
}
