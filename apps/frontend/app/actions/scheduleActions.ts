'use server';

import { revalidateTag } from 'next/cache';
import { serverSchedulesApi } from '@/lib/auth/server-api';
import type { HabitSchedule } from '@/lib/typeDefinitions';

export async function getSchedulesByHabit(habitId: string): Promise<HabitSchedule[]> {
  try {
    return await serverSchedulesApi.getByHabit(habitId);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    throw new Error('Не удалось загрузить расписания');
  }
}

export async function createSchedule(formData: FormData) {
  const habitId = formData.get('habitId') as string | null;
  const frequencyType = formData.get('frequencyType') as string | null;
  const frequencyValue = Number(formData.get('frequencyValue') || 1);
  const weekdaysMask = Number(formData.get('weekdaysMask') || 127);
  const startDate = formData.get('startDate') as string | null;
  const endDateRaw = formData.get('endDate') as string | null;
  const isActive = formData.has('isActive');

  if (!habitId || !frequencyType || !startDate) {
    throw new Error('Заполните обязательные поля');
  }

  try {
    await serverSchedulesApi.create({
      habitId,
      frequencyType,
      frequencyValue,
      weekdaysMask,
      startDate,
      endDate: endDateRaw ? endDateRaw : null,
      isActive,
    });
    revalidateTag(`habit-${habitId}`);
    revalidateTag('habits-list');
  } catch (error) {
    console.error('Error creating schedule:', error);
    throw new Error('Не удалось создать расписание');
  }
}

export async function updateSchedule(id: string, habitId: string, formData: FormData) {
  const frequencyType = formData.get('frequencyType') as string | null;
  const frequencyValue = formData.get('frequencyValue');
  const weekdaysMask = formData.get('weekdaysMask');
  const startDate = formData.get('startDate') as string | null;
  const endDateRaw = formData.get('endDate') as string | null;
  const isActive = formData.has('isActive');

  try {
    await serverSchedulesApi.update(id, {
      frequencyType: frequencyType || undefined,
      frequencyValue: frequencyValue !== null ? Number(frequencyValue) : undefined,
      weekdaysMask: weekdaysMask !== null ? Number(weekdaysMask) : undefined,
      startDate: startDate || undefined,
      endDate: endDateRaw ? endDateRaw : null,
      isActive,
    });
    revalidateTag(`habit-${habitId}`);
    revalidateTag('habits-list');
  } catch (error) {
    console.error('Error updating schedule:', error);
    throw new Error('Не удалось обновить расписание');
  }
}

export async function deleteSchedule(id: string, habitId: string) {
  try {
    await serverSchedulesApi.delete(id);
    revalidateTag(`habit-${habitId}`);
    revalidateTag('habits-list');
  } catch (error) {
    console.error('Error deleting schedule:', error);
    throw new Error('Не удалось удалить расписание');
  }
}
