'use server';

import { revalidateTag } from 'next/cache';
import { serverHabitsApi } from '@/lib/auth/server-api';
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

  if (!name || !type) {
    throw new Error('Заполните все поля');
  }

  try {
    await serverHabitsApi.create({ name, type, description });
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

  if (!name || !type) {
    throw new Error('Заполните все поля');
  }

  try {
    await serverHabitsApi.update(id, { name, type, description });
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
