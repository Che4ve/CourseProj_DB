import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateHabitDto {
  name: string;
  description?: string;
  type: 'good' | 'bad';
  color?: string;
  priority?: number;
}

export interface UpdateHabitDto {
  name?: string;
  description?: string;
  type?: 'good' | 'bad';
  color?: string;
  priority?: number;
  isArchived?: boolean;
}

@Injectable()
export class HabitsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string): Promise<any> {
    await this.prisma.setUserId(userId);
    return this.prisma.habit.findMany({
      where: { userId, isArchived: false },
      include: {
        tags: {
          include: { tag: true },
        },
        schedules: true,
        reminders: true,
        stats: true,
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async findOne(id: string, userId: string): Promise<any> {
    await this.prisma.setUserId(userId);
    const habit = await this.prisma.habit.findFirst({
      where: { id, userId },
      include: {
        tags: {
          include: { tag: true },
        },
        schedules: true,
        reminders: true,
        stats: true,
        checkins: {
          take: 30,
          orderBy: { checkinDate: 'desc' },
        },
      },
    });

    if (!habit) {
      throw new NotFoundException('Habit not found');
    }

    return habit;
  }

  async create(userId: string, dto: CreateHabitDto): Promise<any> {
    await this.prisma.setUserId(userId);
    return this.prisma.habit.create({
      data: {
        ...dto,
        userId,
      },
      include: {
        tags: {
          include: { tag: true },
        },
        schedules: true,
        reminders: true,
      },
    });
  }

  async update(id: string, userId: string, dto: UpdateHabitDto): Promise<any> {
    await this.prisma.setUserId(userId);
    // Проверяем, что привычка принадлежит пользователю
    const habit = await this.prisma.habit.findFirst({
      where: { id, userId },
    });

    if (!habit) {
      throw new NotFoundException('Habit not found');
    }

    return this.prisma.habit.update({
      where: { id },
      data: dto,
      include: {
        tags: {
          include: { tag: true },
        },
        schedules: true,
        reminders: true,
      },
    });
  }

  async delete(id: string, userId: string): Promise<any> {
    await this.prisma.setUserId(userId);
    // Проверяем, что привычка принадлежит пользователю
    const habit = await this.prisma.habit.findFirst({
      where: { id, userId },
    });

    if (!habit) {
      throw new NotFoundException('Habit not found');
    }

    await this.prisma.habit.delete({
      where: { id },
    });

    return { message: 'Habit deleted successfully' };
  }
}


