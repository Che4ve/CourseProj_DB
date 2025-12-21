import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatDateDisplay } from '@/lib/utils/dateUtils';

interface DailyStatsViewProps {
  data: Array<{
    date: string;
    total_checkins: number;
    unique_habits: number;
    avg_mood: number | null;
    total_duration: number | null;
  }>;
}

export function DailyStatsView({ data }: DailyStatsViewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ежедневная статистика</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-muted-foreground">
            <tr>
              <th className="py-2 text-left">Дата</th>
              <th className="py-2 text-left">Отметки</th>
              <th className="py-2 text-left">Привычки</th>
              <th className="py-2 text-left">Настроение</th>
              <th className="py-2 text-left">Длительность</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item.date} className="border-t">
                <td className="py-2">{formatDateDisplay(item.date)}</td>
                <td className="py-2">{item.total_checkins}</td>
                <td className="py-2">{item.unique_habits}</td>
                <td className="py-2">{item.avg_mood ?? '—'}</td>
                <td className="py-2">
                  {item.total_duration ? `${item.total_duration} мин` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
