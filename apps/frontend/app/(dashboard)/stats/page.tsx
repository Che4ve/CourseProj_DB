import { getCompletionRate, getDailyStats, getHabitsReport, getStreaks } from '@/app/actions/reportActions';
import { CompletionRateChart } from '@/components/stats/CompletionRateChart';
import { DailyStatsView } from '@/components/stats/DailyStatsView';
import { HabitStatsCard } from '@/components/stats/HabitStatsCard';
import { StatsChart } from '@/components/stats/StatsChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default async function StatsPage() {
  const [completionRate, dailyStats, habitsReport, streaks] = await Promise.all([
    getCompletionRate(),
    getDailyStats(14),
    getHabitsReport(),
    getStreaks(),
  ]);

  const reportMap = new Map(habitsReport.map((item) => [item.habit_id, item]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Статистика</h1>
        <p className="text-sm text-muted-foreground">
          Общий прогресс, ежедневная активность и серии выполнения.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <CompletionRateChart rate={completionRate.completionRate} />
        <StatsChart data={[...dailyStats].reverse()} />
      </div>

      <DailyStatsView data={dailyStats} />

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Серии выполнения</h2>
        {streaks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Нет данных по сериям.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {streaks.slice(0, 6).map((streak) => {
              const report = reportMap.get(streak.habit_id);
              return (
                <HabitStatsCard
                  key={streak.habit_id}
                  name={streak.habit_name}
                  currentStreak={streak.current_streak}
                  longestStreak={streak.longest_streak}
                  completionRate={report?.completion_rate}
                  lastCheckin={streak.last_checkin}
                />
              );
            })}
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Отчет по привычкам</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground">
              <tr>
                <th className="py-2 text-left">Привычка</th>
                <th className="py-2 text-left">Тип</th>
                <th className="py-2 text-left">Отметки</th>
                <th className="py-2 text-left">% выполнения</th>
                <th className="py-2 text-left">Последняя отметка</th>
              </tr>
            </thead>
            <tbody>
              {habitsReport.map((row) => (
                <tr key={row.habit_id} className="border-t">
                  <td className="py-2">{row.habit_name}</td>
                  <td className="py-2">{row.habit_type === 'good' ? 'Хорошая' : 'Плохая'}</td>
                  <td className="py-2">{row.total_checkins}</td>
                  <td className="py-2">
                    {row.completion_rate === null || row.completion_rate === undefined
                      ? '—'
                      : `${row.completion_rate.toFixed(1)}%`}
                  </td>
                  <td className="py-2">{row.last_checkin ? row.last_checkin.slice(0, 10) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
