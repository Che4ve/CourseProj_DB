import { Injectable } from '@nestjs/common';
import { Prisma } from '@repo/db';
import { PrismaService } from '../prisma/prisma.service';

export interface BatchImportDto {
  entityType: 'habits' | 'checkins' | 'tags';
  data: any[];
}

@Injectable()
export class BatchImportService {
  constructor(private prisma: PrismaService) {}

  private static readonly UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  private slugify(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private parseNumber(value: unknown): number | null {
    let parsed: number | null = null;
    if (typeof value === 'number' && Number.isFinite(value)) {
      parsed = value;
    } else if (typeof value === 'string' && value.trim() !== '') {
      const asNumber = Number(value);
      parsed = Number.isFinite(asNumber) ? asNumber : null;
    }
    if (parsed === null) {
      return null;
    }
    return Math.trunc(parsed);
  }

  private parseDate(value: unknown): Date | null {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(String(value));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private async insertHabits(
    tx: Prisma.TransactionClient,
    userId: string,
    records: Array<{
      name: string;
      description: string | null;
      type: string;
      color: string;
      priority: number;
    }>,
  ): Promise<number> {
    if (records.length === 0) return 0;

    const rows = records.map(
      (record) =>
        Prisma.sql`(${userId}::uuid, ${record.name}, ${record.description}, ${record.type}, ${record.color}, ${record.priority})`,
    );

    const result = await tx.$queryRaw<Array<{ count: number }>>(Prisma.sql`
      WITH inserted AS (
        INSERT INTO habits (user_id, name, description, type, color, priority)
        VALUES ${Prisma.join(rows)}
        RETURNING 1
      )
      SELECT COUNT(*)::int as count FROM inserted
    `);

    return Number(result[0]?.count ?? 0);
  }

  private async insertCheckins(
    tx: Prisma.TransactionClient,
    userId: string,
    records: Array<{
      habitId: string;
      checkinDate: Date;
      notes: string | null;
      moodRating: number | null;
      durationMinutes: number | null;
    }>,
  ): Promise<number> {
    if (records.length === 0) return 0;

    const rows = records.map(
      (record) =>
        Prisma.sql`(${record.habitId}::uuid, ${record.checkinDate}, ${record.notes}, ${record.moodRating}, ${record.durationMinutes})`,
    );

    const result = await tx.$queryRaw<Array<{ count: number }>>(Prisma.sql`
      WITH inserted AS (
        INSERT INTO habit_checkins (
          habit_id,
          user_id,
          checkin_date,
          notes,
          mood_rating,
          duration_minutes
        )
        VALUES ${Prisma.join(rows)}
        ON CONFLICT (habit_id, checkin_date) DO NOTHING
        RETURNING 1
      )
      SELECT COUNT(*)::int as count FROM inserted
    `);

    return Number(result[0]?.count ?? 0);
  }

  private async insertTags(
    tx: Prisma.TransactionClient,
    records: Array<{ name: string; slug: string; color: string }>,
  ): Promise<number> {
    if (records.length === 0) return 0;

    const rows = records.map(
      (record) => Prisma.sql`(${record.name}, ${record.slug}, ${record.color})`,
    );

    const result = await tx.$queryRaw<Array<{ count: number }>>(Prisma.sql`
      WITH inserted AS (
        INSERT INTO tags (name, slug, color)
        VALUES ${Prisma.join(rows)}
        ON CONFLICT DO NOTHING
        RETURNING 1
      )
      SELECT COUNT(*)::int as count FROM inserted
    `);

    return Number(result[0]?.count ?? 0);
  }

  async importData(userId: string, dto: BatchImportDto) {
    // Создаём batch job
    const job = await this.prisma.batchImportJob.create({
      data: {
        userId,
        entityType: dto.entityType,
        status: 'processing',
        totalRecords: dto.data.length,
        fileSizeBytes: BigInt(JSON.stringify(dto.data).length),
      },
    });

    const totalRecords = dto.data.length;
    const validationErrors: Array<{
      rowNumber: number;
      recordData: Prisma.InputJsonValue;
      errorMessage: string;
      errorCode?: string;
    }> = [];

    let successCount = 0;
    let errorCount = 0;

    const habitIdSet =
      dto.entityType === 'checkins'
        ? new Set(
            (
              await this.prisma.habit.findMany({
                where: { userId },
                select: { id: true },
              })
            ).map((habit) => habit.id),
          )
        : null;

    try {
      if (dto.entityType === 'habits') {
        const records: Array<{
          name: string;
          description: string | null;
          type: string;
          color: string;
          priority: number;
        }> = [];

        dto.data.forEach((record, index) => {
          const name = typeof record?.name === 'string' ? record.name.trim() : '';
          if (!name) {
            validationErrors.push({
              rowNumber: index + 1,
              recordData: record as Prisma.InputJsonValue,
              errorMessage: 'Habit name is required',
              errorCode: 'VALIDATION',
            });
            return;
          }

          const type = record?.type === 'bad' ? 'bad' : 'good';
          const priority = this.parseNumber(record?.priority) ?? 0;

          records.push({
            name,
            description:
              typeof record?.description === 'string' ? record.description : null,
            type,
            color: typeof record?.color === 'string' ? record.color : '#6366f1',
            priority,
          });
        });

        if (records.length > 0) {
          successCount = await this.prisma.$transaction(async (tx) => {
            await tx.$executeRaw`SELECT set_config('app.user_id', ${userId}, true)`;
            return this.insertHabits(tx, userId, records);
          });
        }
      } else if (dto.entityType === 'checkins') {
        const habitIds = habitIdSet ?? new Set<string>();
        const records: Array<{
          habitId: string;
          checkinDate: Date;
          notes: string | null;
          moodRating: number | null;
          durationMinutes: number | null;
        }> = [];

        dto.data.forEach((record, index) => {
          const habitId =
            typeof record?.habitId === 'string' ? record.habitId : '';
          if (
            !habitId ||
            !BatchImportService.UUID_REGEX.test(habitId) ||
            !habitIds.has(habitId)
          ) {
            validationErrors.push({
              rowNumber: index + 1,
              recordData: record as Prisma.InputJsonValue,
              errorMessage: 'Habit not found or does not belong to user',
              errorCode: 'HABIT_NOT_FOUND',
            });
            return;
          }

          const checkinDate = this.parseDate(record?.checkinDate);
          if (!checkinDate) {
            validationErrors.push({
              rowNumber: index + 1,
              recordData: record as Prisma.InputJsonValue,
              errorMessage: 'Invalid checkin date',
              errorCode: 'VALIDATION',
            });
            return;
          }

          records.push({
            habitId,
            checkinDate,
            notes: typeof record?.notes === 'string' ? record.notes : null,
            moodRating: this.parseNumber(record?.moodRating),
            durationMinutes: this.parseNumber(record?.durationMinutes),
          });
        });

        if (records.length > 0) {
          successCount = await this.prisma.$transaction(async (tx) => {
            await tx.$executeRaw`SELECT set_config('app.user_id', ${userId}, true)`;
            return this.insertCheckins(tx, userId, records);
          });
        }
      } else if (dto.entityType === 'tags') {
        const records: Array<{ name: string; slug: string; color: string }> = [];

        dto.data.forEach((record, index) => {
          const name = typeof record?.name === 'string' ? record.name.trim() : '';
          if (!name) {
            validationErrors.push({
              rowNumber: index + 1,
              recordData: record as Prisma.InputJsonValue,
              errorMessage: 'Tag name is required',
              errorCode: 'VALIDATION',
            });
            return;
          }

          const slugFromInput =
            typeof record?.slug === 'string' ? this.slugify(record.slug) : '';
          const slug = slugFromInput || this.slugify(name) || 'tag';

          records.push({
            name,
            slug,
            color: typeof record?.color === 'string' ? record.color : '#gray',
          });
        });

        if (records.length > 0) {
          successCount = await this.prisma.$transaction(async (tx) => {
            await tx.$executeRaw`SELECT set_config('app.user_id', ${userId}, true)`;
            return this.insertTags(tx, records);
          });
        }
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error';
      const errorCode = error?.code || 'UNKNOWN';

      validationErrors.length = 0;
      dto.data.forEach((record, index) => {
        validationErrors.push({
          rowNumber: index + 1,
          recordData: record as Prisma.InputJsonValue,
          errorMessage,
          errorCode,
        });
      });
    }

    if (validationErrors.length > 0) {
      await this.prisma.batchImportError.createMany({
        data: validationErrors.map((entry) => ({
          jobId: job.id,
          rowNumber: entry.rowNumber,
          recordData: entry.recordData,
          errorMessage: entry.errorMessage,
          errorCode: entry.errorCode,
        })),
      });
    }

    errorCount = totalRecords - successCount;

    // Финализируем job
    await this.prisma.batchImportJob.update({
      where: { id: job.id },
      data: {
        status: errorCount === totalRecords ? 'failed' : 'completed',
        successCount,
        errorCount,
        progressPercent: 100,
        completedAt: new Date(),
      },
    });

    return {
      jobId: job.id,
      totalRecords,
      successCount,
      errorCount,
      status: errorCount === totalRecords ? 'failed' : 'completed',
    };
  }

  async getJobStatus(jobId: string, userId: string): Promise<any> {
    return this.prisma.batchImportJob.findFirst({
      where: { id: jobId, userId },
      include: {
        errors: {
          take: 100,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }
}
