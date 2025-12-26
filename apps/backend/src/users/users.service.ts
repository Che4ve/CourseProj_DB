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
    const [user, summaryRow] = await Promise.all([
      this.prisma.user.findUnique({
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
      }),
      this.prisma.$queryRaw<
        Array<{
          total_habits: bigint;
          good_habits: bigint;
          bad_habits: bigint;
          total_checkins: bigint;
          last_activity: Date | null;
        }>
      >`
        SELECT
          total_habits,
          good_habits,
          bad_habits,
          total_checkins,
          last_activity
        FROM v_user_habit_summary
        WHERE user_id = ${userId}::uuid
      `,
    ]);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const summary = summaryRow[0]
      ? {
          totalHabits: Number(summaryRow[0].total_habits),
          goodHabits: Number(summaryRow[0].good_habits),
          badHabits: Number(summaryRow[0].bad_habits),
          totalCheckins: Number(summaryRow[0].total_checkins),
          lastActivity: summaryRow[0].last_activity,
        }
      : {
          totalHabits: 0,
          goodHabits: 0,
          badHabits: 0,
          totalCheckins: 0,
          lastActivity: null,
        };

    if (user.profile) {
      return { ...user, summary };
    }

    const profile = await this.prisma.userProfile.create({
      data: { userId },
    });

    return { ...user, profile, summary };
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
