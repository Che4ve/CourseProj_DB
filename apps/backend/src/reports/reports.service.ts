import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  // ✅ ПАРАМЕТРИЗОВАННЫЙ SQL через $queryRaw
  async getUserHabitsReport(userId: string, fromDate: string, toDate: string) {
    // Используем табличную функцию report_user_habits
    const result = await this.prisma.$queryRaw<Array<{
      habit_id: string;
      habit_name: string;
      habit_type: string;
      total_checkins: bigint;
      completion_rate: number;
      last_checkin: Date | null;
    }>>`
      SELECT * FROM report_user_habits(
        ${userId}::uuid,
        ${fromDate}::date,
        ${toDate}::date
      )
    `;

    return result.map(row => ({
      ...row,
      total_checkins: Number(row.total_checkins),
    }));
  }

  // ✅ ПАРАМЕТРИЗОВАННЫЙ SQL: сложный отчёт с JOIN и агрегацией
  async getDailyStats(userId: string, days: number = 30) {
    const result = await this.prisma.$queryRaw<Array<{
      date: Date;
      total_checkins: bigint;
      unique_habits: bigint;
      avg_mood: number | null;
      total_duration: bigint | null;
    }>>`
      SELECT 
        hc.checkin_date as date,
        COUNT(*) as total_checkins,
        COUNT(DISTINCT hc.habit_id) as unique_habits,
        ROUND(AVG(hc.mood_rating), 2) as avg_mood,
        SUM(hc.duration_minutes) as total_duration
      FROM habit_checkins hc
      JOIN habits h ON h.id = hc.habit_id
      WHERE h.user_id = ${userId}::uuid
        AND hc.checkin_date >= CURRENT_DATE - ${days}::integer
      GROUP BY hc.checkin_date
      ORDER BY hc.checkin_date DESC
    `;

    return result.map(row => ({
      ...row,
      total_checkins: Number(row.total_checkins),
      unique_habits: Number(row.unique_habits),
      total_duration: row.total_duration ? Number(row.total_duration) : null,
    }));
  }

  // ✅ ПАРАМЕТРИЗОВАННЫЙ SQL: использование скалярной функции
  async getCompletionRate(userId: string, fromDate: string, toDate: string) {
    const result = await this.prisma.$queryRaw<Array<{ rate: number }>>`
      SELECT calc_completion_rate(
        ${userId}::uuid,
        ${fromDate}::date,
        ${toDate}::date
      ) as rate
    `;

    return { completionRate: result[0]?.rate || 0 };
  }

  // ✅ ПАРАМЕТРИЗОВАННЫЙ SQL: агрегация с подзапросами
  async getHabitStreaks(userId: string) {
    const result = await this.prisma.$queryRaw<Array<{
      habit_id: string;
      habit_name: string;
      current_streak: number;
      longest_streak: number;
      last_checkin: Date | null;
    }>>`
      SELECT 
        h.id as habit_id,
        h.name as habit_name,
        COALESCE(hs.current_streak, 0) as current_streak,
        COALESCE(hs.longest_streak, 0) as longest_streak,
        hs.last_checkin_at as last_checkin
      FROM habits h
      LEFT JOIN habit_stats hs ON hs.habit_id = h.id
      WHERE h.user_id = ${userId}::uuid
        AND NOT h.is_archived
      ORDER BY hs.current_streak DESC NULLS LAST
    `;

    return result;
  }
}





