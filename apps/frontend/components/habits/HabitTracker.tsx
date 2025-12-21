"use client";

import { useMemo, useState } from "react";
import type { HabitCheckin } from "@/lib/typeDefinitions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { useToast } from "@/contexts/ToastContext";
import { updateCompletion } from "@/app/actions/completionActions";
import { useCompletionTracker } from "@/hooks/useCompletionTracker";
import { useHabitCalendar } from "@/hooks/useHabitCalendar";
import { useCheckinDetails } from "@/hooks/useCheckinDetails";
import { findCheckinForDate } from "@/components/habits/habitTrackerUtils";
import {
	formatDate,
	getToday,
	getMonthName,
	isToday,
	isFutureDate,
} from "@/lib/utils/dateUtils";
import {
	Angry,
	Check,
	ChevronLeft,
	ChevronRight,
	Frown,
	Laugh,
	Meh,
	RefreshCw,
	Smile,
} from "lucide-react";

interface HabitTrackerProps {
	habitId: string;
	completions: HabitCheckin[];
	onPendingChange?: (isPending: boolean) => void;
}

export function HabitTracker({
	habitId,
	completions,
	onPendingChange,
}: HabitTrackerProps) {
	const [error, setError] = useState<string | null>(null);
	const [detailsPending, setDetailsPending] = useState(false);
	const { startOperation, finishOperation } = useToast();

	const {
		calendarDays,
		currentMonthDate,
		isCurrentMonth,
		weekDays,
		goToPreviousMonth,
		goToNextMonth,
	} = useHabitCalendar();

	const todayStr = getToday();
	const {
		optimisticCompletions,
		pendingSet,
		pendingImmediateSet,
		queueDateToggle,
		toggleDateImmediate,
	} = useCompletionTracker({
		habitId,
		completions,
		onPendingChange,
		onError: setError,
		startOperation,
		finishOperation,
	});

	const todayCheckin = useMemo(
		() => findCheckinForDate(completions, todayStr),
		[completions, todayStr],
	);
	const isTodayCompleted = optimisticCompletions.has(todayStr);
	const {
		notes,
		setNotes,
		moodRating,
		setMoodRating,
		durationMinutes,
		setDurationMinutes,
		hasChanges,
		buildUpdatePayload,
		markSavedDetails,
	} = useCheckinDetails(todayCheckin, isTodayCompleted);
	const isPendingForToday = pendingImmediateSet.has(todayStr) || detailsPending;

	const handleUpdateToday = async () => {
		setError(null);
		setDetailsPending(true);
		startOperation();

		try {
			const payload = buildUpdatePayload();
			await updateCompletion(habitId, todayStr, payload);
			markSavedDetails(payload);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Произошла ошибка");
		} finally {
			setDetailsPending(false);
			finishOperation();
		}
	};

	const handleTodayClick = () => {
		if (isTodayCompleted && hasChanges) {
			void handleUpdateToday();
			return;
		}

		toggleDateImmediate(new Date());
	};

	return (
		<div className="space-y-4">
			{error && (
				<div className="text-sm text-red-500 p-2 bg-red-50 rounded border border-red-200">
					{error}
				</div>
			)}

			{/* Навигация по месяцам */}
			<div className="flex items-center justify-between">
				<Button
					variant="ghost"
					size="icon"
					onClick={goToPreviousMonth}
					className="h-8 w-8"
				>
					<ChevronLeft className="h-4 w-4" />
				</Button>

				<h3 className="font-semibold text-center capitalize">
					{getMonthName(currentMonthDate)}
				</h3>

				<Button
					variant="ghost"
					size="icon"
					onClick={goToNextMonth}
					disabled={isCurrentMonth}
					className="h-8 w-8"
				>
					<ChevronRight className="h-4 w-4" />
				</Button>
			</div>

			{/* Календарь */}
			<div className="grid grid-cols-7 gap-1">
				{/* Заголовки дней недели */}
				{weekDays.map((day) => (
					<div
						key={day}
						className="text-center text-xs font-medium text-muted-foreground py-2"
					>
						{day}
					</div>
				))}

				{/* Дни месяца */}
				{calendarDays.map((day) => {
					const dateStr = formatDate(day);
					const isCompleted = optimisticCompletions.has(dateStr);
					const isPendingForDate = pendingSet.has(dateStr);
					const isTodayDate = isToday(day);
					const isFuture = isFutureDate(day);
					const isCurrentMonthDay =
						day.getMonth() === currentMonthDate.getMonth();

					return (
						<button
							key={dateStr}
							type="button"
							onClick={() => !isFuture && queueDateToggle(day)}
							disabled={isFuture}
							aria-busy={isPendingForDate}
							className={`
                aspect-square p-1 rounded-lg text-sm font-medium
                transition-colors duration-200 flex items-center justify-center
                ${!isCurrentMonthDay ? "text-muted-foreground/40" : ""}
                ${isFuture ? "cursor-not-allowed opacity-30" : "cursor-pointer"}
                ${isPendingForDate ? "cursor-wait" : ""}
                ${
									isCompleted
										? "bg-green-500/20 text-green-700 hover:bg-green-500/30"
										: "bg-accent hover:bg-accent/80"
								}
                ${isTodayDate && !isCompleted ? "ring-2 ring-primary ring-offset-1" : ""}
                ${isTodayDate && isCompleted ? "ring-2 ring-green-500/50 ring-offset-1" : ""}
                disabled:hover:bg-accent
              `}
						>
							{day.getDate()}
						</button>
					);
				})}
			</div>

			<Button
				onClick={handleTodayClick}
				disabled={isPendingForToday}
				className="w-full h-12 text-base font-semibold"
				variant={
					hasChanges ? "default" : isTodayCompleted ? "outline" : "default"
				}
			>
				{isPendingForToday ? (
					<>
						<div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
						Сохранение...
					</>
				) : isTodayCompleted ? (
					hasChanges ? (
						<>
							<RefreshCw className="h-5 w-5 mr-2" />
							Обновить
						</>
					) : (
						<>
							<Check className="h-5 w-5 mr-2" />
							Выполнено сегодня
						</>
					)
				) : (
					"Отметить сегодня"
				)}
			</Button>
			<div
				className={`overflow-hidden transition-all duration-300 ease-in-out ${
					isTodayCompleted
						? "max-h-[360px] opacity-100 translate-y-0"
						: "max-h-0 opacity-0 -translate-y-2 pointer-events-none"
				}`}
			>
				<div className="mt-2 space-y-2 rounded-lg border border-border p-3">
					<Label htmlFor="checkin-notes">Детали отметки</Label>
					<textarea
						name="notes"
						value={notes}
						onChange={(event) => setNotes(event.target.value)}
						placeholder="Заметки о выполнении"
						disabled={!isTodayCompleted || isPendingForToday}
						className="min-h-[80px] w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm"
					/>
					<div className="grid gap-2 sm:grid-cols-2">
						<div className="space-y-1">
							<Label>Настроение</Label>
							<div className="flex flex-nowrap gap-2">
								{[
									{ value: "1", Icon: Angry, label: "1" },
									{ value: "2", Icon: Frown, label: "2" },
									{ value: "3", Icon: Meh, label: "3" },
									{ value: "4", Icon: Smile, label: "4" },
									{ value: "5", Icon: Laugh, label: "5" },
								].map(({ value, Icon, label }) => {
									const isSelected = moodRating === value;
									return (
										<button
											key={value}
											type="button"
											aria-pressed={isSelected}
											onClick={() => setMoodRating(value)}
											disabled={!isTodayCompleted || isPendingForToday}
											className={`h-9 w-9 rounded-md border text-sm transition-colors flex items-center justify-center ${
												isSelected
													? "border-blue-500 text-blue-600 bg-blue-50"
													: "border-border text-muted-foreground hover:bg-accent"
											} disabled:cursor-not-allowed disabled:opacity-50`}
										>
											<Icon className="h-5 w-5" />
											<span className="sr-only">{label}</span>
										</button>
									);
								})}
							</div>
						</div>
						<div className="space-y-1">
							<Label htmlFor="durationMinutes">Длительность (мин)</Label>
							<Input
								type="number"
								min="1"
								value={durationMinutes}
								onChange={(event) => setDurationMinutes(event.target.value)}
								disabled={!isTodayCompleted || isPendingForToday}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
