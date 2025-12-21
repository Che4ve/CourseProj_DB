'use server';

import { revalidateTag } from 'next/cache';
import { serverCheckinsApi } from '@/lib/auth/server-api';
import type { HabitCheckin } from '@/lib/typeDefinitions';

export async function getCompletions(habitId: string): Promise<HabitCheckin[]> {
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
export async function setCompletion(
  habitId: string,
  date: string,
  completed: boolean,
  details?: { notes?: string; moodRating?: number; durationMinutes?: number }
) {
  // Валидация формата даты (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('Неверный формат даты');
  }

  try {
    if (completed) {
      await serverCheckinsApi.create({ habitId, date, ...details });
    } else {
      await serverCheckinsApi.delete(habitId, date);
    }
    // Точечная инвалидация кэша для конкретной привычки
    revalidateTag(`habit-${habitId}`);
    revalidateTag('habits-list');
  } catch (error) {
    console.error('Error setting completion:', error);
    // Идемпотентность: если запись уже существует или не существует, это не ошибка
    // Поэтому мы просто логируем ошибку, но не пробрасываем её
  }
}

export async function updateCompletion(
  habitId: string,
  date: string,
  details: { notes?: string | null; moodRating?: number | null; durationMinutes?: number | null }
) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('Неверный формат даты');
  }

  try {
    await serverCheckinsApi.update(habitId, date, details);
    revalidateTag(`habit-${habitId}`);
    revalidateTag('habits-list');
  } catch (error) {
    console.error('Error updating completion:', error);
    throw new Error('Не удалось обновить отметку');
  }
}

export async function setCompletionsBatch(
  habitId: string,
  updates: Array<{ date: string; completed: boolean }>
) {
  const results: Array<{ date: string; completed: boolean; ok: boolean }> = [];

  for (const update of updates) {
    const { date, completed } = update;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      results.push({ date, completed, ok: false });
      continue;
    }

    try {
      if (completed) {
        await serverCheckinsApi.create({ habitId, date });
      } else {
        await serverCheckinsApi.delete(habitId, date);
      }
      results.push({ date, completed, ok: true });
    } catch (error) {
      console.error('Error setting completion:', error);
      results.push({ date, completed, ok: false });
    }
  }

  if (results.some((result) => result.ok)) {
    revalidateTag(`habit-${habitId}`);
    revalidateTag('habits-list');
  }

  return results;
}
