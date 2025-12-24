import test from 'node:test';
import assert from 'node:assert/strict';
import { BadRequestException } from '@nestjs/common';
import { BatchImportService } from '../src/batch-import/batch-import.service';
import { BatchImportEntityType } from '../src/batch-import/dto/batch-import.dto';

test('importData rejects batches over 1000 records', async () => {
  const prisma = {} as any;
  const service = new BatchImportService(prisma);
  const data = Array.from({ length: 1001 }, () => ({ name: 'Habit' }));

  await assert.rejects(
    () =>
      service.importData('user-id', {
        entityType: BatchImportEntityType.Habits,
        data,
      }),
    (error: Error) => error instanceof BadRequestException,
  );
});

test('importData rejects invalid entity type', async () => {
  const prisma = {} as any;
  const service = new BatchImportService(prisma);

  await assert.rejects(
    () =>
      service.importData('user-id', {
        entityType: 'unknown' as BatchImportEntityType,
        data: [],
      }),
    (error: Error) => error instanceof BadRequestException,
  );
});

test('importData stores validation errors for invalid records', async () => {
  let recordedErrors: any[] = [];
  const prisma = {
    batchImportJob: {
      create: async () => ({ id: 'job-id' }),
      update: async () => ({}),
    },
    batchImportError: {
      createMany: async ({ data }: { data: any[] }) => {
        recordedErrors = data;
      },
    },
    habit: {
      findMany: async () => [],
    },
    $transaction: async () => 0,
  } as any;

  const service = new BatchImportService(prisma);

  const result = await service.importData('user-id', {
    entityType: BatchImportEntityType.Habits,
    data: [{ name: '' }],
  });

  assert.equal(result.errorCount, 1);
  assert.equal(result.status, 'failed');
  assert.equal(recordedErrors.length, 1);
  assert.equal(recordedErrors[0].errorMessage, 'Habit name is required');
});
