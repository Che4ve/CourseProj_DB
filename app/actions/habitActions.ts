'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { Habit, HabitType } from '@/lib/typeDefinitions';

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
    return { error: 'Не авторизован' };
  }

  const name = formData.get('name') as string;
  const type = formData.get('type') as HabitType;

  if (!name || !type) {
    return { error: 'Заполните все поля' };
  }

  const { error } = await supabase.from('habits').insert([{ user_id: user.id, name, type }]);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/');
  return { success: true };
}

export async function updateHabit(id: string, formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Не авторизован' };
  }

  const name = formData.get('name') as string;
  const type = formData.get('type') as HabitType;

  if (!name || !type) {
    return { error: 'Заполните все поля' };
  }

  const { error } = await supabase
    .from('habits')
    .update({ name, type })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/');
  return { success: true };
}

export async function deleteHabit(id: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Не авторизован' };
  }

  const { error } = await supabase.from('habits').delete().eq('id', id).eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/');
  return { success: true };
}
