import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@repo/db';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHabitDto } from './dto/create-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';

const habitBaseSelect = {
  id: true,
  userId: true,
  name: true,
  description: true,
  type: true,
  priority: true,
  isArchived: true,
  displayOrder: true,
  createdAt: true,
} satisfies Prisma.HabitSelect;

const habitRelationsSelect = {
  tags: {
    include: { tag: true },
  },
  schedules: true,
  reminders: true,
} satisfies Prisma.HabitSelect;

const habitListSelect = {
  ...habitBaseSelect,
  ...habitRelationsSelect,
  stats: true,
} satisfies Prisma.HabitSelect;

const habitDetailSelect = {
  ...habitBaseSelect,
  ...habitRelationsSelect,
  stats: true,
  checkins: {
    take: 30,
    orderBy: { checkinDate: 'desc' },
  },
} satisfies Prisma.HabitSelect;

const habitCreateSelect = {
  ...habitBaseSelect,
  ...habitRelationsSelect,
} satisfies Prisma.HabitSelect;

@Injectable()
export class HabitsService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string): Promise<any> {
    await this.prisma.setUserId(userId);
    return this.prisma.habit.findMany({
      where: { userId, isArchived: false },
      select: habitListSelect,
      orderBy: { displayOrder: 'asc' },
    });
  }

  async findOne(id: string, userId: string): Promise<any> {
    await this.prisma.setUserId(userId);
    const habit = await this.prisma.habit.findFirst({
      where: { id, userId },
      select: habitDetailSelect,
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
      select: habitCreateSelect,
    });
  }

  async update(id: string, userId: string, dto: UpdateHabitDto): Promise<any> {
    await this.prisma.setUserId(userId);
    // Проверяем, что привычка принадлежит пользователю
    const habit = await this.prisma.habit.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!habit) {
      throw new NotFoundException('Habit not found');
    }

    return this.prisma.habit.update({
      where: { id },
      data: dto,
      select: habitCreateSelect,
    });
  }

  async delete(id: string, userId: string): Promise<any> {
    await this.prisma.setUserId(userId);
    // Проверяем, что привычка принадлежит пользователю
    const habit = await this.prisma.habit.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!habit) {
      throw new NotFoundException('Habit not found');
    }

    await this.prisma.habit.delete({
      where: { id },
      select: { id: true },
    });

    return { message: 'Habit deleted successfully' };
  }
}
