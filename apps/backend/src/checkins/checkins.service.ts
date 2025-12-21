import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateCheckinDto {
  habitId: string;
  date?: string; // YYYY-MM-DD format (optional, defaults to today)
  checkinDate?: Date; // Alternative: Date object
  notes?: string;
  moodRating?: number;
  durationMinutes?: number;
}

@Injectable()
export class CheckinsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateCheckinDto) {
    // Проверяем, что привычка принадлежит пользователю
    const habit = await this.prisma.habit.findFirst({
      where: { id: dto.habitId, userId },
    });

    if (!habit) {
      throw new NotFoundException('Habit not found');
    }

    // Parse date if provided as string
    let checkinDate = dto.checkinDate;
    if (dto.date && !checkinDate) {
      checkinDate = new Date(dto.date);
    }
    if (!checkinDate) {
      checkinDate = new Date();
    }

    // Try to create, but ignore if already exists (idempotency)
    try {
      return await this.prisma.habitCheckin.create({
        data: {
          habitId: dto.habitId,
          userId,
          checkinDate,
          notes: dto.notes,
          moodRating: dto.moodRating,
          durationMinutes: dto.durationMinutes,
        },
      });
    } catch (error) {
      // If unique constraint violation, return existing record
      if (error.code === 'P2002') {
        return this.prisma.habitCheckin.findFirst({
          where: {
            habitId: dto.habitId,
            userId,
            checkinDate,
          },
        });
      }
      throw error;
    }
  }

  async findByHabit(habitId: string, userId: string, limit = 30) {
    // Проверяем, что привычка принадлежит пользователю
    const habit = await this.prisma.habit.findFirst({
      where: { id: habitId, userId },
    });

    if (!habit) {
      throw new NotFoundException('Habit not found');
    }

    return this.prisma.habitCheckin.findMany({
      where: { habitId },
      orderBy: { checkinDate: 'desc' },
      take: limit,
    });
  }

  async delete(id: string, userId: string) {
    const checkin = await this.prisma.habitCheckin.findFirst({
      where: { id, userId },
    });

    if (!checkin) {
      throw new NotFoundException('Checkin not found');
    }

    await this.prisma.habitCheckin.delete({
      where: { id },
    });

    return { message: 'Checkin deleted successfully' };
  }

  async deleteByHabitAndDate(habitId: string, date: string, userId: string) {
    // Проверяем, что привычка принадлежит пользователю
    const habit = await this.prisma.habit.findFirst({
      where: { id: habitId, userId },
    });

    if (!habit) {
      throw new NotFoundException('Habit not found');
    }

    // Parse date string (YYYY-MM-DD)
    const checkinDate = new Date(date);

    // Delete checkin if exists (idempotent)
    const result = await this.prisma.habitCheckin.deleteMany({
      where: {
        habitId,
        userId,
        checkinDate,
      },
    });

    return { message: 'Checkin deleted successfully', deletedCount: result.count };
  }
}

