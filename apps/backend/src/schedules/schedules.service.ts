import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

@Injectable()
export class SchedulesService {
  constructor(private prisma: PrismaService) {}

  private parseDate(value: string | Date): Date {
    if (value instanceof Date) {
      return value;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      throw new BadRequestException('Date is required');
    }

    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException('Invalid date');
    }

    return parsed;
  }

  private parseOptionalDate(value?: string | Date | null): Date | null | undefined {
    if (value === undefined) {
      return undefined;
    }
    if (value === null) {
      return null;
    }

    return this.parseDate(value);
  }

  async findByHabit(habitId: string, userId: string) {
    const habit = await this.prisma.habit.findFirst({
      where: { id: habitId, userId },
    });

    if (!habit) {
      throw new NotFoundException('Habit not found');
    }

    return this.prisma.habitSchedule.findMany({
      where: { habitId },
      orderBy: { startDate: 'desc' },
    });
  }

  async create(userId: string, dto: CreateScheduleDto) {
    await this.prisma.setUserId(userId);

    const habit = await this.prisma.habit.findFirst({
      where: { id: dto.habitId, userId },
    });

    if (!habit) {
      throw new NotFoundException('Habit not found');
    }

    return this.prisma.habitSchedule.create({
      data: {
        habitId: dto.habitId,
        frequencyType: dto.frequencyType,
        frequencyValue: dto.frequencyValue ?? 1,
        weekdaysMask: dto.weekdaysMask ?? 127,
        startDate: this.parseDate(dto.startDate),
        endDate: this.parseOptionalDate(dto.endDate),
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, userId: string, dto: UpdateScheduleDto) {
    await this.prisma.setUserId(userId);

    const schedule = await this.prisma.habitSchedule.findFirst({
      where: { id, habit: { userId } },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    return this.prisma.habitSchedule.update({
      where: { id },
      data: {
        frequencyType: dto.frequencyType ?? undefined,
        frequencyValue: dto.frequencyValue ?? undefined,
        weekdaysMask: dto.weekdaysMask ?? undefined,
        startDate: dto.startDate ? this.parseDate(dto.startDate) : undefined,
        endDate: this.parseOptionalDate(dto.endDate),
        isActive: dto.isActive ?? undefined,
      },
    });
  }

  async delete(id: string, userId: string) {
    await this.prisma.setUserId(userId);

    const schedule = await this.prisma.habitSchedule.findFirst({
      where: { id, habit: { userId } },
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    await this.prisma.habitSchedule.delete({
      where: { id },
    });

    return { message: 'Schedule deleted successfully' };
  }
}
