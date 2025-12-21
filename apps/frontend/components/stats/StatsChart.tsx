import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatDateDisplay } from '@/lib/utils/dateUtils';

interface StatsChartProps {
  data: Array<{
    date: string;
    total_checkins: number;
  }>;
}

export function StatsChart({ data }: StatsChartProps) {
  const maxValue = Math.max(1, ...data.map((item) => item.total_checkins));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Активность по дням</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.map((item) => {
          const width = (item.total_checkins / maxValue) * 100;
          return (
            <div key={item.date} className="flex items-center gap-3">
              <div className="w-20 text-xs text-muted-foreground">{formatDateDisplay(item.date)}</div>
              <div className="flex-1">
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-emerald-500"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
              <div className="w-8 text-right text-xs font-medium">{item.total_checkins}</div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
