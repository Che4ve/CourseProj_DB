import test from 'node:test';
import assert from 'node:assert/strict';
import { NotFoundException } from '@nestjs/common';
import { CheckinsService } from '../src/checkins/checkins.service';

test('findByHabit throws when habit is missing', async () => {
  const prisma = {
    habit: {
      findFirst: async () => null,
    },
  } as any;

  const service = new CheckinsService(prisma);

  await assert.rejects(
    () => service.findByHabit('habit-id', 'user-id', 30),
    (error: Error) => error instanceof NotFoundException,
  );
});

test('updateBatchByHabit marks invalid dates as failed', async () => {
  const prisma = {
    habit: {
      findFirst: async () => ({ id: 'habit-id' }),
    },
  } as any;

  const service = new CheckinsService(prisma);

  const result = await service.updateBatchByHabit('habit-id', 'user-id', {
    updates: [{ date: 'invalid-date', completed: true }],
  });

  assert.equal(result.length, 1);
  assert.equal(result[0].ok, false);
});
