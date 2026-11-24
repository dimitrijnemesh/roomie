import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { memoryStorage } from 'multer';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { ApiErrorDto } from '../auth/dto/responses.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PhotoDto, ProfileDto } from './dto/profile.dto';
import { ReorderPhotosDto } from './dto/reorder-photos.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { MAX_PHOTO_BYTES, PhotosService } from './photos.service';
import { ProfileService } from './profile.service';

@ApiTags('profile')
@ApiBearerAuth()
@Controller()
export class ProfileController {
  constructor(
    private readonly profile: ProfileService,
    private readonly photos: PhotosService,
  ) {}

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

  @Post('profile/me/photos')
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @UseInterceptors(
    FileInterceptor('photo', { storage: memoryStorage(), limits: { fileSize: MAX_PHOTO_BYTES, files: 1, fields: 0 } }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { photo: { type: 'string', format: 'binary' } } } })
  @ApiOperation({ summary: 'Додати фото', description: 'JPG / PNG / WEBP до 5 МБ, максимум 4. Повертає всі фото.' })
  @ApiResponse({ status: 201, type: [PhotoDto] })
  @ApiResponse({ status: 400, type: ApiErrorDto, description: 'PHOTO_REQUIRED · PHOTO_INVALID · TOO_MANY_PHOTOS' })
  @ApiResponse({ status: 413, type: ApiErrorDto, description: 'Файл більший за 5 МБ' })
  async addPhoto(@CurrentUser() user: User, @UploadedFile() file?: Express.Multer.File) {
    const photos = await this.photos.add(user, file);
    await this.profile.refreshOnboarded(user);
    return photos;
  }

  @Delete('profile/me/photos/:id')
  @ApiOperation({ summary: 'Видалити фото' })
  @ApiResponse({ status: 200, type: [PhotoDto] })
  @ApiResponse({ status: 404, type: ApiErrorDto, description: 'PHOTO_NOT_FOUND' })
  async removePhoto(@CurrentUser() user: User, @Param('id') id: string) {
    const photos = await this.photos.remove(user, id);
    await this.profile.refreshOnboarded(user);
    return photos;
  }

  @Put('profile/me/photos/order')
  @HttpCode(200)
  @ApiOperation({ summary: 'Змінити порядок фото', description: 'Перше фото стає головним.' })
  @ApiResponse({ status: 200, type: [PhotoDto] })
  reorderPhotos(@CurrentUser() user: User, @Body() dto: ReorderPhotosDto) {
    return this.photos.reorder(user, dto.ids);
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Публічна анкета іншого студента', description: 'Без пошти. Лише заповнені анкети.' })
  @ApiResponse({ status: 200, type: ProfileDto })
  @ApiResponse({ status: 404, type: ApiErrorDto, description: 'USER_NOT_FOUND' })
  getPublic(@Param('id') id: string) {
    return this.profile.getPublic(id);
  }
}
