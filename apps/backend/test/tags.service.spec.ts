import test from 'node:test';
import assert from 'node:assert/strict';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TagsService } from '../src/tags/tags.service';

test('create rejects empty tag name', async () => {
  const prisma = {} as any;
  const service = new TagsService(prisma);

  await assert.rejects(
    () => service.create('user-id', { name: '   ' } as any),
    (error: Error) => error instanceof BadRequestException,
  );
});

test('update rejects empty tag name for owned tag', async () => {
  const prisma = {
    auditLog: {
      findFirst: async () => ({ id: 'audit-id' }),
    },
  } as any;
  const service = new TagsService(prisma);

  await assert.rejects(
    () => service.update('tag-id', 'user-id', { name: '  ' } as any),
    (error: Error) => error instanceof BadRequestException,
  );
});

test('update rejects tag not owned by user', async () => {
  const prisma = {
    auditLog: {
      findFirst: async () => null,
    },
  } as any;
  const service = new TagsService(prisma);

  await assert.rejects(
    () => service.update('tag-id', 'user-id', { name: 'Work' } as any),
    (error: Error) => error instanceof NotFoundException,
  );
});
