import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface BatchImportDto {
  entityType: 'habits' | 'checkins' | 'tags';
  data: any[];
}

@Injectable()
export class BatchImportService {
  constructor(private prisma: PrismaService) {}

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

    let successCount = 0;
    let errorCount = 0;

    // Обрабатываем каждую запись
    for (let i = 0; i < dto.data.length; i++) {
      try {
        const record = dto.data[i];

        if (dto.entityType === 'habits') {
          await this.prisma.habit.create({
            data: {
              userId,
              name: record.name,
              description: record.description,
              type: record.type || 'good',
              color: record.color || '#6366f1',
              priority: record.priority || 0,
            },
          });
        } else if (dto.entityType === 'checkins') {
          // Проверяем, что привычка существует и принадлежит пользователю
          const habit = await this.prisma.habit.findFirst({
            where: { id: record.habitId, userId },
          });

          if (!habit) {
            throw new Error('Habit not found or does not belong to user');
          }

          await this.prisma.habitCheckin.create({
            data: {
              habitId: record.habitId,
              userId,
              checkinDate: new Date(record.checkinDate),
              notes: record.notes,
              moodRating: record.moodRating,
              durationMinutes: record.durationMinutes,
            },
          });
        } else if (dto.entityType === 'tags') {
          await this.prisma.tag.create({
            data: {
              name: record.name,
              slug: record.slug || record.name.toLowerCase().replace(/\s+/g, '-'),
              color: record.color || '#gray',
            },
          });
        }

        successCount++;
      } catch (error) {
        errorCount++;

        // Логируем ошибку
        await this.prisma.batchImportError.create({
          data: {
            jobId: job.id,
            rowNumber: i + 1,
            recordData: dto.data[i],
            errorMessage: error.message || 'Unknown error',
            errorCode: error.code || 'UNKNOWN',
          },
        });
      }

      // Обновляем прогресс каждые 100 записей
      if ((i + 1) % 100 === 0) {
        await this.prisma.batchImportJob.update({
          where: { id: job.id },
          data: {
            successCount,
            errorCount,
            progressPercent: ((i + 1) / dto.data.length) * 100,
          },
        });
      }
    }

    // Финализируем job
    await this.prisma.batchImportJob.update({
      where: { id: job.id },
      data: {
        status: errorCount === dto.data.length ? 'failed' : 'completed',
        successCount,
        errorCount,
        progressPercent: 100,
        completedAt: new Date(),
      },
    });

    return {
      jobId: job.id,
      totalRecords: dto.data.length,
      successCount,
      errorCount,
      status: errorCount === dto.data.length ? 'failed' : 'completed',
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


