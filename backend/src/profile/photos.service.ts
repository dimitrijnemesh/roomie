import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import sharp from 'sharp';
import { ApiException } from '../common/exceptions/api.exception';
import { PrismaService } from '../prisma/prisma.service';
import { PhotoDto } from './dto/profile.dto';
import { publicUrl, removeFile, saveFile } from './photos.storage';

export const MAX_PHOTOS = 4;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_FORMATS = ['jpeg', 'png', 'webp', 'heif'];

@Injectable()
export class PhotosService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string): Promise<PhotoDto[]> {
    const photos = await this.prisma.photo.findMany({ where: { userId }, orderBy: { position: 'asc' } });
    return photos.map((p) => ({ id: p.id, url: publicUrl(p.file) }));
  }

  /**
   * The upload is decoded and re-encoded: anything that is not a real image is rejected,
   * and EXIF data (e.g. GPS location from phones) is dropped.
   */
  async add(user: User, file?: Express.Multer.File): Promise<PhotoDto[]> {
    if (!file?.buffer?.length) throw new ApiException(400, 'PHOTO_REQUIRED', 'Обери фото', 'photo');

    const count = await this.prisma.photo.count({ where: { userId: user.id } });
    if (count >= MAX_PHOTOS) throw new ApiException(400, 'TOO_MANY_PHOTOS', `Максимум ${MAX_PHOTOS} фото`, 'photo');

    let webp: Buffer;
    try {
      const image = sharp(file.buffer, { limitInputPixels: 40_000_000 });
      const { format } = await image.metadata();
      if (!format || !ALLOWED_FORMATS.includes(format)) throw new Error('format');
      webp = await image
        .rotate() // respect phone orientation before EXIF is dropped
        .resize(1080, 1350, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
    } catch {
      throw new ApiException(400, 'PHOTO_INVALID', 'Це не схоже на фото. Підходять JPG, PNG або WEBP', 'photo');
    }

    const name = await saveFile(webp, 'webp');
    await this.prisma.photo.create({ data: { userId: user.id, file: name, position: count } });
    return this.list(user.id);
  }

  async remove(user: User, photoId: string): Promise<PhotoDto[]> {
    const photo = await this.prisma.photo.findFirst({ where: { id: photoId, userId: user.id } });
    if (!photo) throw new ApiException(404, 'PHOTO_NOT_FOUND', 'Фото не знайдено');

    await this.prisma.photo.delete({ where: { id: photo.id } });
    await removeFile(photo.file);
    await this.renumber(user.id);
    return this.list(user.id);
  }

  /** New order of the user's photos; the first one becomes the main photo. */
  async reorder(user: User, ids: string[]): Promise<PhotoDto[]> {
    const photos = await this.prisma.photo.findMany({ where: { userId: user.id } });
    const mine = new Set(photos.map((p) => p.id));
    if (ids.length !== photos.length || new Set(ids).size !== ids.length || !ids.every((id) => mine.has(id))) {
      throw new ApiException(400, 'INVALID_ORDER', 'Невірний порядок фото', 'ids');
    }
    await this.prisma.$transaction(ids.map((id, position) => this.prisma.photo.update({ where: { id }, data: { position } })));
    return this.list(user.id);
  }

  private async renumber(userId: string) {
    const photos = await this.prisma.photo.findMany({ where: { userId }, orderBy: { position: 'asc' } });
    await this.prisma.$transaction(
      photos.map((p, position) => this.prisma.photo.update({ where: { id: p.id }, data: { position } })),
    );
  }
}
