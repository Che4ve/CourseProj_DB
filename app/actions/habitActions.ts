'use server';

import { revalidateTag } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Habit, HabitType } from '@/lib/typeDefinitions';

export async function getHabits() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Не авторизован');
  }

  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as Habit[];
}

export async function createHabit(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Не авторизован');
  }

  const name = formData.get('name') as string;
  const type = formData.get('type') as HabitType;

  if (!name || !type) {
    throw new Error('Заполните все поля');
  }

  // RLS политика автоматически проверит user_id
  const { error } = await supabase.from('habits').insert([{ user_id: user.id, name, type }]);

  if (error) {
    throw new Error(error.message);
  }

  revalidateTag('habits-list');
}

export async function updateHabit(id: string, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Не авторизован');
  }

  const name = formData.get('name') as string;
  const type = formData.get('type') as HabitType;

  if (!name || !type) {
    throw new Error('Заполните все поля');
  }

  // RLS политика автоматически проверит, что привычка принадлежит пользователю
  // Не нужно явно проверять user_id в WHERE - RLS сделает это за нас
  const { error } = await supabase.from('habits').update({ name, type }).eq('id', id);

  if (error) {
    throw new Error(error.message);
  }

  revalidateTag('habits-list');
  revalidateTag(`habit-${id}`);
}

export async function deleteHabit(id: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Не авторизован');
  }

  // RLS политика автоматически проверит, что привычка принадлежит пользователю
  const { error } = await supabase.from('habits').delete().eq('id', id);

  if (error) {
    throw new Error(error.message);
  }

  revalidateTag('habits-list');
  revalidateTag(`habit-${id}`);
}
