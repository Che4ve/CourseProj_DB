import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';

@Injectable()
export class RemindersService {
  constructor(private prisma: PrismaService) {}

  private parseTime(value: string | Date): Date {
    if (value instanceof Date) {
      return value;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      throw new BadRequestException('Reminder time is required');
    }

    if (/^\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) {
      const normalized = trimmed.length === 5 ? `${trimmed}:00` : trimmed;
      return new Date(`1970-01-01T${normalized}`);
    }

    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('Invalid reminder time');
    }

    return parsed;
  }

  async findByHabit(habitId: string, userId: string) {
    const habit = await this.prisma.habit.findFirst({
      where: { id: habitId, userId },
    });

    if (!habit) {
      throw new NotFoundException('Habit not found');
    }

    return this.prisma.reminder.findMany({
      where: { habitId },
      orderBy: { reminderTime: 'asc' },
    });
  }

  async create(userId: string, dto: CreateReminderDto) {
    await this.prisma.setUserId(userId);

    const habit = await this.prisma.habit.findFirst({
      where: { id: dto.habitId, userId },
    });

    if (!habit) {
      throw new NotFoundException('Habit not found');
    }

    const reminderTime = this.parseTime(dto.reminderTime);

    return this.prisma.reminder.create({
      data: {
        habitId: dto.habitId,
        reminderTime,
        daysOfWeek: dto.daysOfWeek ?? 127,
        notificationText: dto.notificationText,
        deliveryMethod: dto.deliveryMethod ?? 'push',
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, userId: string, dto: UpdateReminderDto) {
    await this.prisma.setUserId(userId);

    const reminder = await this.prisma.reminder.findFirst({
      where: { id, habit: { userId } },
    });

    if (!reminder) {
      throw new NotFoundException('Reminder not found');
    }

    return this.prisma.reminder.update({
      where: { id },
      data: {
        reminderTime: dto.reminderTime ? this.parseTime(dto.reminderTime) : undefined,
        daysOfWeek: dto.daysOfWeek ?? undefined,
        notificationText: dto.notificationText ?? undefined,
        deliveryMethod: dto.deliveryMethod ?? undefined,
        isActive: dto.isActive ?? undefined,
      },
    });
  }

  async delete(id: string, userId: string) {
    await this.prisma.setUserId(userId);

    const reminder = await this.prisma.reminder.findFirst({
      where: { id, habit: { userId } },
    });

    if (!reminder) {
      throw new NotFoundException('Reminder not found');
    }

    await this.prisma.reminder.delete({
      where: { id },
    });

    return { message: 'Reminder deleted successfully' };
  }
}
