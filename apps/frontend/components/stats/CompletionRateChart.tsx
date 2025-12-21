import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface CompletionRateChartProps {
  rate: number;
}

export function CompletionRateChart({ rate }: CompletionRateChartProps) {
  const clamped = Math.max(0, Math.min(100, rate));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Процент выполнения</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-3xl font-semibold">{clamped.toFixed(1)}%</div>
        <div className="h-2 w-full rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary transition-all"
            style={{ width: `${clamped}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
