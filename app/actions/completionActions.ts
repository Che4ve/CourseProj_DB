'use server';

import { revalidateTag } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { HabitCompletion } from '@/lib/typeDefinitions';

export async function getCompletions(habitId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Не авторизован');
  }

  const { data, error } = await supabase
    .from('habit_completions')
    .select('*')
    .eq('habit_id', habitId)
    .order('completed_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as HabitCompletion[];
}

/**
 * Идемпотентное действие установки статуса выполнения привычки.
 * @param habitId - ID привычки
 * @param date - Дата в формате YYYY-MM-DD
 * @param completed - true для установки выполнения, false для удаления
 */
export async function setCompletion(habitId: string, date: string, completed: boolean) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Не авторизован');
  }

  // Валидация формата даты (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('Неверный формат даты');
  }

  if (completed) {
    // Используем upsert для идемпотентности
    // onConflict указывает колонки для проверки дубликатов
    // ignoreDuplicates: true означает что при совпадении не будет ошибки
    const { error } = await supabase
      .from('habit_completions')
      .upsert(
        { habit_id: habitId, completed_at: date },
        { onConflict: 'habit_id, completed_at', ignoreDuplicates: true }
      );

    if (error) {
      // RLS политика автоматически проверит, что привычка принадлежит пользователю
      throw new Error(error.message);
    }
  } else {
    // Удаляем запись, если она существует
    const { error } = await supabase
      .from('habit_completions')
      .delete()
      .eq('habit_id', habitId)
      .eq('completed_at', date);

    if (error) {
      throw new Error(error.message);
    }
  }

  // Точечная инвалидация кэша для конкретной привычки
  revalidateTag(`habit-${habitId}`);
  revalidateTag('habits-list');
}
