'use server';

import { revalidateTag } from 'next/cache';
import { serverHabitsApi, serverTagsApi } from '@/lib/auth/server-api';
import type { Habit, HabitType } from '@/lib/typeDefinitions';

export async function getHabits(): Promise<Habit[]> {
  try {
    return await serverHabitsApi.getAll();
  } catch (error) {
    console.error('Error fetching habits:', error);
    throw new Error('Не удалось загрузить привычки');
  }
}

export async function createHabit(formData: FormData) {
  const name = formData.get('name') as string;
  const type = formData.get('type') as HabitType;
  const description = formData.get('description') as string | undefined;
  const priorityRaw = formData.get('priority') as string | null;
  const priority = priorityRaw ? Number(priorityRaw) : undefined;
  const tagIds = formData.getAll('tagIds') as string[];

  if (!name || !type) {
    throw new Error('Заполните все поля');
  }

  try {
    const habit = await serverHabitsApi.create({ name, type, description, priority });
    if (tagIds.length > 0) {
      await Promise.all(tagIds.map((tagId) => serverTagsApi.attach(tagId, habit.id)));
    }
    revalidateTag('habits-list');
  } catch (error) {
    console.error('Error creating habit:', error);
    throw new Error('Не удалось создать привычку');
  }
}

export async function updateHabit(id: string, formData: FormData) {
  const name = formData.get('name') as string;
  const type = formData.get('type') as HabitType;
  const description = formData.get('description') as string | undefined;
  const priorityRaw = formData.get('priority') as string | null;
  const priority = priorityRaw ? Number(priorityRaw) : undefined;
  const tagIds = formData.getAll('tagIds') as string[];

  if (!name || !type) {
    throw new Error('Заполните все поля');
  }

  try {
    await serverHabitsApi.update(id, { name, type, description, priority });

    const habit = await serverHabitsApi.getOne(id);
    const existingTagIds = habit.tags?.map((tag) => tag.tagId) ?? [];
    const toAttach = tagIds.filter((tagId) => !existingTagIds.includes(tagId));
    const toDetach = existingTagIds.filter((tagId) => !tagIds.includes(tagId));

    if (toAttach.length > 0) {
      await Promise.all(toAttach.map((tagId) => serverTagsApi.attach(tagId, id)));
    }
    if (toDetach.length > 0) {
      await Promise.all(toDetach.map((tagId) => serverTagsApi.detach(tagId, id)));
    }

    revalidateTag('habits-list');
    revalidateTag(`habit-${id}`);
  } catch (error) {
    console.error('Error updating habit:', error);
    throw new Error('Не удалось обновить привычку');
  }
}

export async function deleteHabit(id: string) {
  try {
    await serverHabitsApi.delete(id);
    revalidateTag('habits-list');
    revalidateTag(`habit-${id}`);
  } catch (error) {
    console.error('Error deleting habit:', error);
    throw new Error('Не удалось удалить привычку');
  }
}
