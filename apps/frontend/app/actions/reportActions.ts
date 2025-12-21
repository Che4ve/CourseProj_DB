'use server';

import { serverReportsApi } from '@/lib/auth/server-api';

export async function getHabitsReport(from?: string, to?: string) {
  try {
    return await serverReportsApi.getHabitsReport(from, to);
  } catch (error) {
    console.error('Error fetching habits report:', error);
    throw new Error('Не удалось загрузить отчет по привычкам');
  }
}

export async function getDailyStats(days?: number) {
  try {
    return await serverReportsApi.getDailyStats(days);
  } catch (error) {
    console.error('Error fetching daily stats:', error);
    throw new Error('Не удалось загрузить ежедневную статистику');
  }
}

export async function getCompletionRate(from?: string, to?: string) {
  try {
    return await serverReportsApi.getCompletionRate(from, to);
  } catch (error) {
    console.error('Error fetching completion rate:', error);
    throw new Error('Не удалось загрузить процент выполнения');
  }
}

export async function getStreaks() {
  try {
    return await serverReportsApi.getStreaks();
  } catch (error) {
    console.error('Error fetching streaks:', error);
    throw new Error('Не удалось загрузить серии выполнения');
  }
}
