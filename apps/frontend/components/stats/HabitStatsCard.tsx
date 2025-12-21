import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatDateDisplay } from "@/lib/utils/dateUtils";

interface HabitStatsCardProps {
	name: string;
	currentStreak: number;
	longestStreak: number;
	completionRate?: number | null;
	lastCheckin?: string | null;
}

export function HabitStatsCard({
	name,
	currentStreak,
	longestStreak,
	completionRate,
	lastCheckin,
}: HabitStatsCardProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>{name}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-2 text-sm">
				<div className="flex items-center justify-between">
					<span className="text-muted-foreground">Текущая серия</span>
					<span className="font-semibold">{currentStreak} дней</span>
				</div>
				<div className="flex items-center justify-between">
					<span className="text-muted-foreground">Лучшая серия</span>
					<span className="font-semibold">{longestStreak} дней</span>
				</div>
				<div className="flex items-center justify-between">
					<span className="text-muted-foreground">Процент выполнения</span>
					<span className="font-semibold">
						{completionRate ? `${Number(completionRate).toFixed(1)}%` : "—"}
					</span>
				</div>
				<div className="flex items-center justify-between">
					<span className="text-muted-foreground">Последняя отметка</span>
					<span className="font-semibold">
						{lastCheckin ? formatDateDisplay(lastCheckin) : "—"}
					</span>
				</div>
			</CardContent>
		</Card>
	);
}
