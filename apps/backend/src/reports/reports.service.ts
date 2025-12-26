import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ReportsService {
	constructor(private prisma: PrismaService) {}

	async getUserHabitsReport(userId: string, fromDate: string, toDate: string) {
		// Используем табличную функцию report_user_habits
		const result = await this.prisma.$queryRaw<
			Array<{
				habit_id: string;
				habit_name: string;
				habit_type: string;
				total_checkins: bigint;
				completion_rate: number;
				last_checkin: Date | null;
			}>
		>`
      SELECT * FROM report_user_habits(
        ${userId}::uuid,
        ${fromDate}::date,
        ${toDate}::date
      )
    `;

		return result.map((row) => ({
			...row,
			total_checkins: Number(row.total_checkins),
		}));
	}

	async getDailyStats(userId: string, days: number = 30) {
		const result = await this.prisma.$queryRaw<
			Array<{
				date: Date;
				total_checkins: bigint;
				unique_habits: bigint;
				avg_mood: number | null;
				total_duration: bigint | null;
			}>
		>`
      SELECT 
        checkin_date as date,
        total_checkins,
        unique_habits,
        avg_mood,
        total_minutes as total_duration
      FROM v_daily_completion
      WHERE user_id = ${userId}::uuid
        AND checkin_date >= CURRENT_DATE - ${days}::integer
      ORDER BY checkin_date DESC
    `;

		return result.map((row) => ({
			...row,
			total_checkins: Number(row.total_checkins),
			unique_habits: Number(row.unique_habits),
			total_duration: row.total_duration ? Number(row.total_duration) : null,
		}));
	}

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

	async getHabitStreaks(userId: string) {
		const result = await this.prisma.$queryRaw<
			Array<{
				habit_id: string;
				habit_name: string;
				current_streak: number;
				longest_streak: number;
				last_checkin: Date | null;
			}>
		>`
      WITH habit_list AS (
        SELECT id, name
        FROM habits
        WHERE user_id = ${userId}::uuid
          AND NOT is_archived
      ),
      streaks AS (
        SELECT
          h.id as habit_id,
          h.name as habit_name,
          hc.checkin_date::date as checkin_date,
          hc.checkin_date::date
            - (ROW_NUMBER() OVER (PARTITION BY h.id ORDER BY hc.checkin_date))::int as grp
        FROM habit_list h
        JOIN habit_checkins hc ON hc.habit_id = h.id
      ),
      streak_counts AS (
        SELECT
          habit_id,
          habit_name,
          grp,
          COUNT(*)::int as streak_len,
          MAX(checkin_date) as streak_end
        FROM streaks
        GROUP BY habit_id, habit_name, grp
      ),
      latest_streak AS (
        SELECT DISTINCT ON (habit_id)
          habit_id,
          habit_name,
          streak_len,
          streak_end
        FROM streak_counts
        ORDER BY habit_id, streak_end DESC
      ),
      longest_streak AS (
        SELECT habit_id, MAX(streak_len)::int as longest_streak
        FROM streak_counts
        GROUP BY habit_id
      )
      SELECT
        h.id as habit_id,
        h.name as habit_name,
        CASE
          WHEN ls.streak_end IS NOT NULL
            AND ls.streak_end >= CURRENT_DATE - 1
            THEN ls.streak_len
          ELSE 0
        END as current_streak,
        COALESCE(lg.longest_streak, 0) as longest_streak,
        ls.streak_end as last_checkin
      FROM habit_list h
      LEFT JOIN latest_streak ls ON ls.habit_id = h.id
      LEFT JOIN longest_streak lg ON lg.habit_id = h.id
      ORDER BY current_streak DESC NULLS LAST, h.name
    `;

		return result;
	}
}
