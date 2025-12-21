import { useEffect, useMemo, useRef, useState } from "react";
import {
	setCompletion,
	setCompletionsBatch,
} from "@/app/actions/completionActions";
import type { HabitCheckin } from "@/lib/typeDefinitions";
import { formatDate } from "@/lib/utils/dateUtils";

interface CompletionToggleDetails {
	notes?: string;
	moodRating?: number;
	durationMinutes?: number;
}

interface UseCompletionTrackerOptions {
	habitId: string;
	completions: HabitCheckin[];
	onPendingChange?: (isPending: boolean) => void;
	onError?: (message: string | null) => void;
	startOperation: () => void;
	finishOperation: () => void;
	debounceMs?: number;
}

export function useCompletionTracker({
	habitId,
	completions,
	onPendingChange,
	onError,
	startOperation,
	finishOperation,
	debounceMs = 400,
}: UseCompletionTrackerOptions) {
	const OVERRIDE_TTL_MS = 3000;
	const [pendingSet, setPendingSet] = useState<Set<string>>(new Set());
	const [pendingImmediateSet, setPendingImmediateSet] = useState<Set<string>>(
		new Set(),
	);

	const completionKey = useMemo(() => {
		if (completions.length === 0) return "";
		const dates = completions.map((c) => formatDate(new Date(c.checkinDate)));
		dates.sort();
		return dates.join("|");
	}, [completions]);

	const baseCompletions = useMemo(() => {
		if (!completionKey) return new Set<string>();
		return new Set(completionKey.split("|"));
	}, [completionKey]);

	const [optimisticCompletions, setOptimisticCompletions] = useState<
		Set<string>
	>(() => baseCompletions);

	const lastMutationIdRef = useRef<Record<string, number>>({});
	const queuedCompletionsRef = useRef<Record<string, boolean>>({});
	const batchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const baseCompletionsRef = useRef(baseCompletions);
	const optimisticCompletionsRef = useRef(baseCompletions);
	const optimisticOverridesRef = useRef<
		Record<string, { completed: boolean; expiresAt: number }>
	>({});
	const pendingSetRef = useRef(pendingSet);
	const updatePendingSet = (updater: (prev: Set<string>) => Set<string>) => {
		setPendingSet((prev) => {
			const next = updater(prev);
			pendingSetRef.current = next;
			return next;
		});
	};

	useEffect(() => {
		baseCompletionsRef.current = baseCompletions;
		setOptimisticCompletions(() => {
			const next = new Set(baseCompletions);
			const dirtyDates = new Set<string>();
			const now = Date.now();

			pendingSetRef.current.forEach((date) => dirtyDates.add(date));
			Object.keys(queuedCompletionsRef.current).forEach((date) =>
				dirtyDates.add(date),
			);
			Object.entries(optimisticOverridesRef.current).forEach(
				([date, override]) => {
					const baseCompleted = baseCompletions.has(date);
					if (override.expiresAt <= now || baseCompleted === override.completed) {
						delete optimisticOverridesRef.current[date];
						return;
					}
					dirtyDates.add(date);
				},
			);

			dirtyDates.forEach((date) => {
				if (optimisticCompletionsRef.current.has(date)) {
					next.add(date);
				} else {
					next.delete(date);
				}
			});

			optimisticCompletionsRef.current = next;
			return next;
		});
	}, [baseCompletions]);

	useEffect(() => {
		onPendingChange?.(pendingSet.size > 0);
	}, [pendingSet.size, onPendingChange]);

	useEffect(() => {
		return () => {
			if (batchTimerRef.current) {
				clearTimeout(batchTimerRef.current);
			}
		};
	}, []);

	const applyOptimistic = (dateStr: string, completed: boolean) => {
		optimisticOverridesRef.current[dateStr] = {
			completed,
			expiresAt: Date.now() + OVERRIDE_TTL_MS,
		};
		setOptimisticCompletions((prev) => {
			const next = new Set(prev);
			if (completed) next.add(dateStr);
			else next.delete(dateStr);
			optimisticCompletionsRef.current = next;
			return next;
		});
	};

	const toggleDateImmediate = async (
		date: Date,
		details?: CompletionToggleDetails,
	) => {
		const dateStr = formatDate(date);
		const isCompleted = optimisticCompletionsRef.current.has(dateStr);

		onError?.(null);

		const id = (lastMutationIdRef.current[dateStr] || 0) + 1;
		lastMutationIdRef.current[dateStr] = id;

		updatePendingSet((prev) => {
			const next = new Set(prev);
			next.add(dateStr);
			return next;
		});
		setPendingImmediateSet((prev) => new Set(prev).add(dateStr));
		startOperation();

		applyOptimistic(dateStr, !isCompleted);

		try {
			await setCompletion(habitId, dateStr, !isCompleted, details);

			if (lastMutationIdRef.current[dateStr] === id) {
				const nextBase = new Set(baseCompletionsRef.current);
				if (!isCompleted) {
					nextBase.add(dateStr);
				} else {
					nextBase.delete(dateStr);
				}
				baseCompletionsRef.current = nextBase;
			}
		} catch (err) {
			if (lastMutationIdRef.current[dateStr] !== id) return;
			applyOptimistic(dateStr, isCompleted);
			onError?.(err instanceof Error ? err.message : "Произошла ошибка");
		} finally {
			if (lastMutationIdRef.current[dateStr] === id) {
				updatePendingSet((prev) => {
					const next = new Set(prev);
					next.delete(dateStr);
					return next;
				});
				setPendingImmediateSet((prev) => {
					const next = new Set(prev);
					next.delete(dateStr);
					return next;
				});
				finishOperation();
			}
		}
	};

	const flushQueuedCompletions = async () => {
		const entries = Object.entries(queuedCompletionsRef.current);
		if (entries.length === 0) return;

		const updates = entries.map(([date, completed]) => ({
			date,
			completed,
		}));
		const dates = updates.map((update) => update.date);

		updatePendingSet((prev) => {
			const next = new Set(prev);
			// biome-ignore lint/suspicious/useIterableCallbackReturn: <explanation>
			dates.forEach((date) => next.add(date));
			return next;
		});
		startOperation();

		try {
			const results = await setCompletionsBatch(habitId, updates);
			const failed = results.filter((result) => !result.ok);
			const succeeded = results.filter((result) => result.ok);

			const nextBase = new Set(baseCompletionsRef.current);
			succeeded.forEach((result) => {
				if (result.completed) {
					nextBase.add(result.date);
				} else {
					nextBase.delete(result.date);
				}
			});
			baseCompletionsRef.current = nextBase;

			if (failed.length > 0) {
				failed.forEach((result) => {
					const shouldBeCompleted = nextBase.has(result.date);
					applyOptimistic(result.date, shouldBeCompleted);
				});
				onError?.("Не удалось сохранить некоторые отметки");
			}
		} catch (err) {
			onError?.(err instanceof Error ? err.message : "Произошла ошибка");
		} finally {
			updatePendingSet((prev) => {
				const next = new Set(prev);
				// biome-ignore lint/suspicious/useIterableCallbackReturn: <explanation>
				dates.forEach((date) => next.delete(date));
				return next;
			});
			finishOperation();
		}

		entries.forEach(([date]) => {
			delete queuedCompletionsRef.current[date];
		});
		if (batchTimerRef.current) {
			clearTimeout(batchTimerRef.current);
			batchTimerRef.current = null;
		}
	};

	const queueDateToggle = (date: Date) => {
		const dateStr = formatDate(date);
		const currentState =
			queuedCompletionsRef.current[dateStr] ??
			optimisticCompletionsRef.current.has(dateStr);
		const nextCompleted = !currentState;

		onError?.(null);

		const baseCompleted = baseCompletionsRef.current.has(dateStr);
		if (nextCompleted === baseCompleted) {
			delete queuedCompletionsRef.current[dateStr];
		} else {
			queuedCompletionsRef.current[dateStr] = nextCompleted;
		}

		applyOptimistic(dateStr, nextCompleted);

		if (batchTimerRef.current) {
			clearTimeout(batchTimerRef.current);
		}

		batchTimerRef.current = setTimeout(() => {
			void flushQueuedCompletions();
		}, debounceMs);
	};

	return {
		optimisticCompletions,
		pendingSet,
		pendingImmediateSet,
		queueDateToggle,
		toggleDateImmediate,
	};
}
