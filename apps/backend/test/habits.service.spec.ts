import test from 'node:test';
import assert from 'node:assert/strict';
import { NotFoundException } from '@nestjs/common';
import { HabitsService } from '../src/habits/habits.service';

test('update throws when habit is missing', async () => {
  const prisma = {
    setUserId: async () => {},
    habit: {
      findFirst: async () => null,
    },
  } as any;

  const service = new HabitsService(prisma);

  await assert.rejects(
    () => service.update('habit-id', 'user-id', {} as any),
    (error: Error) => error instanceof NotFoundException,
  );
});

test('delete throws when habit is missing', async () => {
  const prisma = {
    setUserId: async () => {},
    habit: {
      findFirst: async () => null,
    },
  } as any;

  const service = new HabitsService(prisma);

  await assert.rejects(
    () => service.delete('habit-id', 'user-id'),
    (error: Error) => error instanceof NotFoundException,
  );
});

test('findOne throws when habit is missing', async () => {
  const prisma = {
    setUserId: async () => {},
    habit: {
      findFirst: async () => null,
    },
  } as any;

  const service = new HabitsService(prisma);

  await assert.rejects(
    () => service.findOne('habit-id', 'user-id'),
    (error: Error) => error instanceof NotFoundException,
  );
});
