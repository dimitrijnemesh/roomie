import { Injectable } from '@nestjs/common';
import { Prisma, Profile, User } from '@prisma/client';
import { ApiException } from '../common/exceptions/api.exception';
import { type Degree, findFaculty, findSpecialty, maxCourse } from '../config/academics';
import { universityByEmail } from '../config/universities';
import { PrismaService } from '../prisma/prisma.service';
import { PhotoDto, ProfileDto } from './dto/profile.dto';
import { HabitsDto, LookingDto, UpdateProfileDto } from './dto/update-profile.dto';
import { MAX_AGE, MIN_AGE, ageFrom, parseBirthDate } from './age';
import { PhotosService } from './photos.service';

type ProfileData = Partial<
  Pick<Profile, 'gender' | 'birthDate' | 'degree' | 'faculty' | 'specialty' | 'specialization' | 'course' | 'bio'>
> & {
  habits?: Prisma.InputJsonValue;
  looking?: Prisma.InputJsonValue;
};

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly photos: PhotosService,
  ) {}

  async getMine(user: User): Promise<ProfileDto> {
    const profile = await this.prisma.profile.findUnique({ where: { userId: user.id } });
    return this.toDto(user, profile ?? this.emptyProfile(user), await this.photos.list(user.id));
  }

  async updateMine(user: User, dto: UpdateProfileDto): Promise<ProfileDto> {
    const budget = dto.looking?.budget;
    if (budget && budget[0] > budget[1]) {
      throw new ApiException(400, 'VALIDATION_ERROR', 'Бюджет «від» не може бути більшим за «до»', 'looking');
    }

    const data = this.toPrismaData(dto);
    const current = await this.prisma.profile.findUnique({ where: { userId: user.id } });
    this.checkStudy(current?.university ?? this.universityCode(user), { ...current, ...data }, dto);

    const profile = await this.prisma.profile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, university: this.universityCode(user), ...data },
      update: data,
    });
    const photos = await this.photos.list(user.id);
    return this.toDto(await this.syncOnboarded(user, profile, photos.length), profile, photos);
  }

  /** Call after photos change: the profile is complete only with at least one photo. */
  async refreshOnboarded(user: User) {
    const profile = await this.prisma.profile.findUnique({ where: { userId: user.id } });
    const count = await this.prisma.photo.count({ where: { userId: user.id } });
    await this.syncOnboarded(user, profile, count);
  }

  async getPublic(userId: string): Promise<Omit<ProfileDto, 'onboarded'>> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });
    if (!user?.verified || !user.profile || !user.onboarded) {
      throw new ApiException(404, 'USER_NOT_FOUND', 'Такого користувача немає');
    }
    // Others see the age, never the exact date of birth.
    const { onboarded: _, birthDate: __, ...dto } = this.toDto(user, user.profile, await this.photos.list(user.id));
    return dto;
  }

  private async syncOnboarded(user: User, profile: Profile | null, photoCount: number): Promise<User> {
    const onboarded = !!profile && this.isComplete(profile) && photoCount > 0;
    return onboarded === user.onboarded ? user : this.prisma.user.update({ where: { id: user.id }, data: { onboarded } });
  }

  /**
   * Faculty and specialty must come from the user's university list; the course must fit the degree.
   * Checked on the merged profile, so partial updates can't create a mismatch.
   */
  private checkStudy(
    university: string,
    p: { faculty?: string | null; specialty?: string | null; degree?: string | null; course?: number | null },
    dto: UpdateProfileDto,
  ) {
    if (p.faculty && dto.faculty !== undefined && !findFaculty(university, p.faculty)) {
      throw new ApiException(400, 'VALIDATION_ERROR', 'Обери факультет зі списку свого вишу', 'faculty');
    }
    if (p.specialty && (dto.specialty !== undefined || dto.faculty !== undefined)) {
      if (!p.faculty || !findSpecialty(university, p.faculty, p.specialty)) {
        throw new ApiException(400, 'VALIDATION_ERROR', 'Обери спеціальність зі списку цього факультету', 'specialty');
      }
    }
    if (p.degree && p.course && p.course > maxCourse(p.degree as Degree, university)) {
      throw new ApiException(400, 'VALIDATION_ERROR', `Для цього ступеня курс — від 1 до ${maxCourse(p.degree as Degree, university)}`, 'course');
    }
  }

  private isComplete(p: Profile): boolean {
    return (
      p.gender !== null &&
      p.birthDate !== null &&
      p.degree !== null &&
      p.faculty !== null &&
      p.specialty !== null &&
      p.course !== null &&
      p.habits !== null &&
      p.looking !== null
    );
  }

  private universityCode(user: User): string {
    return universityByEmail(user.email)?.code ?? 'unknown';
  }

  private emptyProfile(user: User): Profile {
    return {
      userId: user.id,
      university: this.universityCode(user),
      gender: null,
      birthDate: null,
      degree: null,
      faculty: null,
      specialty: null,
      specialization: null,
      course: null,
      bio: null,
      habits: null,
      looking: null,
      updatedAt: new Date(),
    };
  }

  private toPrismaData(dto: UpdateProfileDto): ProfileData {
    const data: ProfileData = {};
    if (dto.gender !== undefined) data.gender = dto.gender;
    if (dto.birthDate !== undefined) {
      const date = parseBirthDate(dto.birthDate);
      if (!date || date > new Date()) {
        throw new ApiException(400, 'VALIDATION_ERROR', 'Такої дати не існує — перевір день і місяць', 'birthDate');
      }
      const age = ageFrom(date);
      if (age < MIN_AGE || age > MAX_AGE) {
        throw new ApiException(400, 'VALIDATION_ERROR', `Roomie — для студентів від ${MIN_AGE} до ${MAX_AGE} років`, 'birthDate');
      }
      data.birthDate = date;
    }
    if (dto.degree !== undefined) data.degree = dto.degree;
    if (dto.faculty !== undefined) data.faculty = dto.faculty;
    if (dto.specialty !== undefined) data.specialty = dto.specialty;
    if (dto.specialization !== undefined) data.specialization = dto.specialization || null;
    if (dto.course !== undefined) data.course = dto.course;
    if (dto.bio !== undefined) data.bio = dto.bio;
    if (dto.habits !== undefined) data.habits = { ...dto.habits };
    if (dto.looking !== undefined) data.looking = { ...dto.looking };
    return data;
  }

  private toDto(user: User, p: Profile, photos: PhotoDto[]): ProfileDto {
    return {
      id: user.id,
      name: user.name,
      university: p.university,
      gender: p.gender,
      birthDate: p.birthDate ? p.birthDate.toISOString().slice(0, 10) : null,
      age: p.birthDate ? ageFrom(p.birthDate) : null,
      degree: p.degree,
      faculty: p.faculty,
      specialty: p.specialty,
      specialization: p.specialization,
      course: p.course,
      bio: p.bio,
      habits: p.habits as HabitsDto | null,
      looking: p.looking as LookingDto | null,
      photos,
      onboarded: user.onboarded,
    };
  }
}
