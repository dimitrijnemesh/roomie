import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { PhotosService } from './photos.service';
import { ProfileService } from './profile.service';

@Module({
  controllers: [ProfileController],
  providers: [ProfileService, PhotosService],
})
export class ProfileModule {}
