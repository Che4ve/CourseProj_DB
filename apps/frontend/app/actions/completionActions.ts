'use server';

import { revalidateTag } from 'next/cache';
import { serverCheckinsApi } from '@/lib/auth/server-api';
import type { HabitCompletion } from '@/lib/typeDefinitions';

export async function getCompletions(habitId: string): Promise<HabitCompletion[]> {
  try {
    return await serverCheckinsApi.getByHabit(habitId);
  } catch (error) {
    console.error('Error fetching completions:', error);
    throw new Error('Не удалось загрузить отметки');
  }
}

/**
 * Идемпотентное действие установки статуса выполнения привычки.
 * @param habitId - ID привычки
 * @param date - Дата в формате YYYY-MM-DD
 * @param completed - true для установки выполнения, false для удаления
 */
export async function setCompletion(habitId: string, date: string, completed: boolean) {
  // Валидация формата даты (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('Неверный формат даты');
  }

  try {
    await serverCheckinsApi.toggle(habitId, date, completed);
    // Точечная инвалидация кэша для конкретной привычки
    revalidateTag(`habit-${habitId}`);
    revalidateTag('habits-list');
  } catch (error) {
    console.error('Error setting completion:', error);
    // Идемпотентность: если запись уже существует или не существует, это не ошибка
    // Поэтому мы просто логируем ошибку, но не пробрасываем её
  }
}
