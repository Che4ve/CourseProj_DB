'use server';

import { revalidatePath } from 'next/cache';
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

export async function toggleCompletion(habitId: string, date: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Не авторизован' };
  }

  // Check if habit belongs to user
  const { data: habit } = await supabase
    .from('habits')
    .select('id')
    .eq('id', habitId)
    .eq('user_id', user.id)
    .single();

  if (!habit) {
    return { error: 'Привычка не найдена' };
  }

  // Check if completion already exists
  const { data: existing } = await supabase
    .from('habit_completions')
    .select('id')
    .eq('habit_id', habitId)
    .eq('completed_at', date)
    .single();

  if (existing) {
    // Delete completion
    const { error } = await supabase.from('habit_completions').delete().eq('id', existing.id);

    if (error) {
      return { error: error.message };
    }
  } else {
    // Create completion
    const { error } = await supabase
      .from('habit_completions')
      .insert([{ habit_id: habitId, completed_at: date }]);

    if (error) {
      return { error: error.message };
    }
  }

  revalidatePath('/');
  return { success: true };
}
