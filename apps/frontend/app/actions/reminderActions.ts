'use server';

import { revalidateTag } from 'next/cache';
import { serverRemindersApi } from '@/lib/auth/server-api';
import type { Reminder } from '@/lib/typeDefinitions';

export async function getRemindersByHabit(habitId: string): Promise<Reminder[]> {
  try {
    return await serverRemindersApi.getByHabit(habitId);
  } catch (error) {
    console.error('Error fetching reminders:', error);
    throw new Error('Не удалось загрузить напоминания');
  }
}

export async function createReminder(formData: FormData) {
  const habitId = formData.get('habitId') as string | null;
  const reminderTime = formData.get('reminderTime') as string | null;
  const daysOfWeek = Number(formData.get('daysOfWeek') || 127);
  const notificationText = (formData.get('notificationText') as string | null) || undefined;
  const deliveryMethod = (formData.get('deliveryMethod') as string | null) || undefined;
  const isActive = formData.has('isActive');

  if (!habitId || !reminderTime) {
    throw new Error('Заполните обязательные поля');
  }

  try {
    await serverRemindersApi.create({
      habitId,
      reminderTime,
      daysOfWeek,
      notificationText,
      deliveryMethod,
      isActive,
    });
    revalidateTag(`habit-${habitId}`);
    revalidateTag('habits-list');
  } catch (error) {
    console.error('Error creating reminder:', error);
    throw new Error('Не удалось создать напоминание');
  }
}

export async function updateReminder(id: string, habitId: string, formData: FormData) {
  const reminderTime = formData.get('reminderTime') as string | null;
  const daysOfWeek = formData.get('daysOfWeek');
  const notificationText = (formData.get('notificationText') as string | null) || undefined;
  const deliveryMethod = (formData.get('deliveryMethod') as string | null) || undefined;
  const isActive = formData.has('isActive');

  try {
    await serverRemindersApi.update(id, {
      reminderTime: reminderTime || undefined,
      daysOfWeek: daysOfWeek !== null ? Number(daysOfWeek) : undefined,
      notificationText,
      deliveryMethod,
      isActive,
    });
    revalidateTag(`habit-${habitId}`);
    revalidateTag('habits-list');
  } catch (error) {
    console.error('Error updating reminder:', error);
    throw new Error('Не удалось обновить напоминание');
  }
}

export async function deleteReminder(id: string, habitId: string) {
  try {
    await serverRemindersApi.delete(id);
    revalidateTag(`habit-${habitId}`);
    revalidateTag('habits-list');
  } catch (error) {
    console.error('Error deleting reminder:', error);
    throw new Error('Не удалось удалить напоминание');
  }
}
