import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private parseOptionalDate(value?: string | Date | null): Date | null | undefined {
    if (value === undefined) {
      return undefined;
    }
    if (value === null) {
      return null;
    }
    if (value instanceof Date) {
      return value;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return undefined;
    }

    return parsed;
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
        profile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.profile) {
      return user;
    }

    const profile = await this.prisma.userProfile.create({
      data: { userId },
    });

    return { ...user, profile };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    await this.prisma.setUserId(userId);

    if (dto.fullName) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { fullName: dto.fullName.trim() },
      });
    }

    const profileData = {
      bio: dto.bio ?? undefined,
      avatarUrl: dto.avatarUrl ?? undefined,
      timezone: dto.timezone ?? undefined,
      dateOfBirth: this.parseOptionalDate(dto.dateOfBirth),
      notificationEnabled: dto.notificationEnabled ?? undefined,
      themePreference: dto.themePreference ?? undefined,
    };

    const profile = await this.prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        ...profileData,
      },
      update: profileData,
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return { ...user, profile };
  }
}
