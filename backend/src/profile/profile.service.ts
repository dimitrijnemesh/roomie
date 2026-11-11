import { Injectable } from '@nestjs/common';
import { Prisma, Profile, User } from '@prisma/client';
import { ApiException } from '../common/exceptions/api.exception';
import { universityByEmail } from '../config/universities';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileDto } from './dto/profile.dto';
import { HabitsDto, LookingDto, UpdateProfileDto } from './dto/update-profile.dto';

type ProfileData = Partial<Pick<Profile, 'age' | 'institute' | 'course' | 'bio'>> & {
  habits?: Prisma.InputJsonValue;
  looking?: Prisma.InputJsonValue;
};

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getMine(user: User): Promise<ProfileDto> {
    const profile = await this.prisma.profile.findUnique({ where: { userId: user.id } });
    return this.toDto(user, profile ?? this.emptyProfile(user));
  }

  async updateMine(user: User, dto: UpdateProfileDto): Promise<ProfileDto> {
    const data = this.toPrismaData(dto);
    const profile = await this.prisma.profile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, university: this.universityCode(user), ...data },
      update: data,
    });

    const onboarded = this.isComplete(profile);
    const updatedUser =
      onboarded === user.onboarded
        ? user
        : await this.prisma.user.update({ where: { id: user.id }, data: { onboarded } });

    return this.toDto(updatedUser, profile);
  }

  async getPublic(userId: string): Promise<Omit<ProfileDto, 'onboarded'>> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });
    if (!user?.verified || !user.profile || !user.onboarded) {
      throw new ApiException(404, 'USER_NOT_FOUND', 'Такого користувача немає');
    }
    const { onboarded: _, ...dto } = this.toDto(user, user.profile);
    return dto;
  }

  private isComplete(p: Profile): boolean {
    return p.age !== null && p.institute !== null && p.course !== null && p.habits !== null && p.looking !== null;
  }

  private universityCode(user: User): string {
    return universityByEmail(user.email)?.code ?? 'unknown';
  }

  private emptyProfile(user: User): Profile {
    return {
      userId: user.id,
      university: this.universityCode(user),
      age: null,
      institute: null,
      course: null,
      bio: null,
      habits: null,
      looking: null,
      updatedAt: new Date(),
    };
  }

  private toPrismaData(dto: UpdateProfileDto): ProfileData {
    const data: ProfileData = {};
    if (dto.age !== undefined) data.age = dto.age;
    if (dto.institute !== undefined) data.institute = dto.institute;
    if (dto.course !== undefined) data.course = dto.course;
    if (dto.bio !== undefined) data.bio = dto.bio;
    if (dto.habits !== undefined) data.habits = { ...dto.habits };
    if (dto.looking !== undefined) data.looking = { ...dto.looking };
    return data;
  }

  private toDto(user: User, p: Profile): ProfileDto {
    return {
      id: user.id,
      name: user.name,
      university: p.university,
      age: p.age,
      institute: p.institute,
      course: p.course,
      bio: p.bio,
      habits: p.habits as HabitsDto | null,
      looking: p.looking as LookingDto | null,
      onboarded: user.onboarded,
    };
  }
}
