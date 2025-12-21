import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateTagDto {
  name: string;
  color?: string;
}

export interface UpdateTagDto {
  name?: string;
  color?: string;
}

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  private slugify(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  async findAll(): Promise<any> {
    return this.prisma.tag.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async create(userId: string, dto: CreateTagDto): Promise<any> {
    await this.prisma.setUserId(userId);

    const name = dto.name?.trim();
    if (!name) {
      throw new BadRequestException('Tag name is required');
    }

    const slug = this.slugify(name);

    return this.prisma.tag.create({
      data: {
        name,
        slug,
        color: dto.color,
      },
    });
  }

  async update(id: string, userId: string, dto: UpdateTagDto): Promise<any> {
    await this.prisma.setUserId(userId);

    const tag = await this.prisma.tag.findUnique({ where: { id } });
    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    if (dto.name !== undefined && !dto.name.trim()) {
      throw new BadRequestException('Tag name is required');
    }

    return this.prisma.tag.update({
      where: { id },
      data: {
        name: dto.name?.trim() ?? undefined,
        color: dto.color ?? undefined,
      },
    });
  }

  async delete(id: string, userId: string): Promise<any> {
    await this.prisma.setUserId(userId);

    const tag = await this.prisma.tag.findUnique({ where: { id } });
    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    await this.prisma.tag.delete({ where: { id } });

    return { message: 'Tag deleted successfully' };
  }

  async attachTagToHabit(tagId: string, habitId: string, userId: string) {
    await this.prisma.setUserId(userId);

    const habit = await this.prisma.habit.findFirst({
      where: { id: habitId, userId },
    });

    if (!habit) {
      throw new NotFoundException('Habit not found');
    }

    const tag = await this.prisma.tag.findUnique({ where: { id: tagId } });
    if (!tag) {
      throw new NotFoundException('Tag not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.habitTag.findUnique({
        where: { habitId_tagId: { habitId, tagId } },
        include: { tag: true },
      });

      if (existing) {
        return existing;
      }

      const created = await tx.habitTag.create({
        data: { habitId, tagId },
        include: { tag: true },
      });

      await tx.tag.update({
        where: { id: tagId },
        data: { usageCount: { increment: 1 } },
      });

      return created;
    });
  }

  async detachTagFromHabit(tagId: string, habitId: string, userId: string) {
    await this.prisma.setUserId(userId);

    const habit = await this.prisma.habit.findFirst({
      where: { id: habitId, userId },
    });

    if (!habit) {
      throw new NotFoundException('Habit not found');
    }

    const habitTag = await this.prisma.habitTag.findUnique({
      where: { habitId_tagId: { habitId, tagId } },
    });

    if (!habitTag) {
      return { message: 'Tag already detached' };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.habitTag.delete({ where: { id: habitTag.id } });

      const tag = await tx.tag.findUnique({ where: { id: tagId } });
      const nextCount = Math.max(0, (tag?.usageCount ?? 0) - 1);

      await tx.tag.update({
        where: { id: tagId },
        data: { usageCount: nextCount },
      });
    });

    return { message: 'Tag detached successfully' };
  }
}
