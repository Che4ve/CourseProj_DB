"use client";

import {
	useRef,
	useState,
	useTransition,
	useEffect,
	useOptimistic,
} from "react";
import type { HabitCheckin } from "@/lib/typeDefinitions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { useToast } from "@/contexts/ToastContext";
import { setCompletion, updateCompletion } from "@/app/actions/completionActions";
import {
	formatDate,
	getToday,
	getMonthName,
	getCalendarDays,
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
	const [, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);
	const { startOperation, finishOperation } = useToast();

	// Календарь начинается с текущего месяца
	const today = new Date();
	const [currentMonth, setCurrentMonth] = useState(today.getMonth());
	const [currentYear, setCurrentYear] = useState(today.getFullYear());

	// useOptimistic: Set of date-strings
	const [optimisticCompletions, applyCompletion] = useOptimistic(
		new Set(completions.map((c) => formatDate(new Date(c.checkinDate)))),
		(state: Set<string>, action: { date: string; completed: boolean }) => {
			const next = new Set(state);
			if (action.completed) next.add(action.date);
			else next.delete(action.date);
			return next;
		},
	);

	// pendingSet: какие конкретно даты находятся в процессе мутации (high-priority state!)
	const [pendingSet, setPendingSet] = useState<Set<string>>(new Set());

	// защита от гонок: id последней мутации для каждой даты
	const lastMutationIdRef = useRef<Record<string, number>>({});

	// Уведомляем родителя о состоянии pending
	useEffect(() => {
		onPendingChange?.(pendingSet.size > 0);
	}, [pendingSet.size, onPendingChange]);

	const todayStr = getToday();
	const todayCheckin = completions.find(
		(checkin) => formatDate(new Date(checkin.checkinDate)) === todayStr,
	);
	const initialDetails = {
		notes: todayCheckin?.notes ?? "",
		moodRating: todayCheckin?.moodRating?.toString() ?? "",
		durationMinutes: todayCheckin?.durationMinutes?.toString() ?? "",
	};

	const [notes, setNotes] = useState(initialDetails.notes);
	const [moodRating, setMoodRating] = useState(initialDetails.moodRating);
	const [durationMinutes, setDurationMinutes] = useState(
		initialDetails.durationMinutes,
	);
	const [savedDetails, setSavedDetails] = useState(initialDetails);

	const handleDateClick = async (
		date: Date,
		details?: { notes?: string; moodRating?: number; durationMinutes?: number },
	) => {
		const dateStr = formatDate(date);
		const isCompleted = optimisticCompletions.has(dateStr);

		setError(null);

		// bump mutation id for this date
		const id = (lastMutationIdRef.current[dateStr] || 0) + 1;
		lastMutationIdRef.current[dateStr] = id;

		// 1) Сначала помечаем дату как pending (синхронно, БЕЗ transition!)
		setPendingSet((prev) => new Set(prev).add(dateStr));

		// Начинаем операцию
		startOperation();

		// 2) Применяем оптимистичное изменение внутри startTransition
		startTransition(() => {
			applyCompletion({ date: dateStr, completed: !isCompleted });
		});

		// 3) делаем реальную мутацию
		try {
			await setCompletion(habitId, dateStr, !isCompleted, details);

			// если это последняя мутация для этой даты — снимаем pending
			if (lastMutationIdRef.current[dateStr] === id) {
				setPendingSet((prev) => {
					const next = new Set(prev);
					next.delete(dateStr);
					return next;
				});

				// Завершаем операцию
				finishOperation();
			}
		} catch (err) {
			// игнорируем устаревшие ошибки
			if (lastMutationIdRef.current[dateStr] !== id) return;

			// Откат оптимистичного апдейта + снять pending
			startTransition(() => {
				applyCompletion({ date: dateStr, completed: isCompleted });
			});

			setPendingSet((prev) => {
				const next = new Set(prev);
				next.delete(dateStr);
				return next;
			});

			setError(err instanceof Error ? err.message : "Произошла ошибка");
			// При ошибке тоже завершаем операцию
			finishOperation();
		}
	};

	const isTodayCompleted = optimisticCompletions.has(todayStr);

	useEffect(() => {
		if (!isTodayCompleted) {
			setNotes("");
			setMoodRating("");
			setDurationMinutes("");
			setSavedDetails({ notes: "", moodRating: "", durationMinutes: "" });
			return;
		}

		if (todayCheckin) {
			const nextDetails = {
				notes: todayCheckin.notes ?? "",
				moodRating: todayCheckin.moodRating?.toString() ?? "",
				durationMinutes: todayCheckin.durationMinutes?.toString() ?? "",
			};

			setNotes(nextDetails.notes);
			setMoodRating(nextDetails.moodRating);
			setDurationMinutes(nextDetails.durationMinutes);
			setSavedDetails(nextDetails);
		}
	}, [
		isTodayCompleted,
		todayCheckin?.id,
		todayCheckin?.notes,
		todayCheckin?.moodRating,
		todayCheckin?.durationMinutes,
	]);

	const buildUpdatePayload = () => {
		const trimmedNotes = notes.trim();
		const moodValue = moodRating ? Number(moodRating) : undefined;
		const durationValue = durationMinutes ? Number(durationMinutes) : undefined;
		const normalizedMood =
			moodValue !== undefined && Number.isNaN(moodValue)
				? undefined
				: moodValue;
		const normalizedDuration =
			durationValue !== undefined && Number.isNaN(durationValue)
				? undefined
				: durationValue;

		return {
			notes: trimmedNotes ? trimmedNotes : null,
			moodRating:
				normalizedMood === undefined ? null : normalizedMood,
			durationMinutes:
				normalizedDuration === undefined ? null : normalizedDuration,
		};
	};

	const hasChanges =
		isTodayCompleted &&
		(notes.trim() !== savedDetails.notes.trim() ||
			moodRating.trim() !== savedDetails.moodRating.trim() ||
			durationMinutes.trim() !== savedDetails.durationMinutes.trim());

	const handleTodayClick = () => {
		const todayDate = new Date();

		if (isTodayCompleted && hasChanges) {
			handleUpdateToday();
			return;
		}

		handleDateClick(todayDate);
	};

	const handleUpdateToday = async () => {
		setError(null);

		// bump mutation id for this date
		const id = (lastMutationIdRef.current[todayStr] || 0) + 1;
		lastMutationIdRef.current[todayStr] = id;

		setPendingSet((prev) => new Set(prev).add(todayStr));
		startOperation();

		try {
			const payload = buildUpdatePayload();
			await updateCompletion(habitId, todayStr, payload);

			if (lastMutationIdRef.current[todayStr] === id) {
				setPendingSet((prev) => {
					const next = new Set(prev);
					next.delete(todayStr);
					return next;
				});

				setSavedDetails({
					notes: payload.notes ?? "",
					moodRating:
						payload.moodRating === null
							? ""
							: payload.moodRating?.toString() ?? "",
					durationMinutes:
						payload.durationMinutes === null
							? ""
							: payload.durationMinutes?.toString() ?? "",
				});

				finishOperation();
			}
		} catch (err) {
			if (lastMutationIdRef.current[todayStr] !== id) return;

			setPendingSet((prev) => {
				const next = new Set(prev);
				next.delete(todayStr);
				return next;
			});

			setError(err instanceof Error ? err.message : "Произошла ошибка");
			finishOperation();
		}
	};

	const goToPreviousMonth = () => {
		if (currentMonth === 0) {
			setCurrentMonth(11);
			setCurrentYear(currentYear - 1);
		} else {
			setCurrentMonth(currentMonth - 1);
		}
	};

	const goToNextMonth = () => {
		// Не позволяем листать дальше текущего месяца
		const now = new Date();
		if (
			currentYear > now.getFullYear() ||
			(currentYear === now.getFullYear() && currentMonth >= now.getMonth())
		) {
			return;
		}

		if (currentMonth === 11) {
			setCurrentMonth(0);
			setCurrentYear(currentYear + 1);
		} else {
			setCurrentMonth(currentMonth + 1);
		}
	};

	const calendarDays = getCalendarDays(currentYear, currentMonth);
	const currentMonthDate = new Date(currentYear, currentMonth);
	const isCurrentMonth =
		currentYear === today.getFullYear() && currentMonth === today.getMonth();

	const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

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
					const isCurrentMonthDay = day.getMonth() === currentMonth;

					return (
						<button
							key={dateStr}
							type="button"
							onClick={() => !isFuture && handleDateClick(day)}
							disabled={isFuture || isPendingForDate}
							className={`
                aspect-square p-1 rounded-lg text-sm font-medium
                transition-all duration-200 flex items-center justify-center
                ${!isCurrentMonthDay ? "text-muted-foreground/40" : ""}
                ${isFuture ? "cursor-not-allowed opacity-30" : "cursor-pointer"}
                ${isPendingForDate ? "cursor-wait animate-pulse" : ""}
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
				disabled={pendingSet.has(todayStr)}
				className="w-full h-12 text-base font-semibold"
				variant={isTodayCompleted ? "outline" : "default"}
			>
				{pendingSet.has(todayStr) ? (
					<>
						<div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2" />
						Сохранение...
					</>
				) : isTodayCompleted ? (
					<>
						<Check className="h-5 w-5 mr-2" />
						{hasChanges ? "Обновить" : "Выполнено сегодня"}
					</>
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
						id="checkin-notes"
						name="notes"
						value={notes}
						onChange={(event) => setNotes(event.target.value)}
						placeholder="Заметки о выполнении"
						disabled={!isTodayCompleted || pendingSet.has(todayStr)}
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
											disabled={!isTodayCompleted || pendingSet.has(todayStr)}
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
								id="durationMinutes"
								type="number"
								min="1"
								value={durationMinutes}
								onChange={(event) => setDurationMinutes(event.target.value)}
								disabled={!isTodayCompleted || pendingSet.has(todayStr)}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
