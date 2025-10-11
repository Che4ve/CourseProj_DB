'use client';

import { useRef, useState, useTransition, useEffect, useOptimistic } from 'react';
import type { HabitCompletion } from '@/lib/typeDefinitions';
import { Checkbox } from '@/components/ui/Checkbox';
import { setCompletion } from '@/app/actions/completionActions';
import { getLast14Days, formatDateDisplay } from '@/lib/utils/dateUtils';

interface HabitTrackerProps {
  habitId: string;
  completions: HabitCompletion[];
  onPendingChange?: (isPending: boolean) => void;
}

export function HabitTracker({ habitId, completions, onPendingChange }: HabitTrackerProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const dates = getLast14Days();

  // useOptimistic: Set of date-strings
  const [optimisticCompletions, applyCompletion] = useOptimistic(
    new Set(completions.map((c) => c.completed_at)),
    (state: Set<string>, action: { date: string; completed: boolean }) => {
      const next = new Set(state);
      if (action.completed) next.add(action.date);
      else next.delete(action.date);
      return next;
    }
  );

  // pendingSet: какие конкретно даты находятся в процессе мутации (high-priority state!)
  const [pendingSet, setPendingSet] = useState<Set<string>>(new Set());

  // защита от гонок: id последней мутации для каждой даты
  const lastMutationIdRef = useRef<Record<string, number>>({});

  // Уведомляем родителя о состоянии pending
  useEffect(() => {
    onPendingChange?.(pendingSet.size > 0 || isPending);
  }, [pendingSet.size, isPending, onPendingChange]);

  const handleChange = async (date: string, checked: boolean) => {
    setError(null);

    // bump mutation id for this date
    const id = (lastMutationIdRef.current[date] || 0) + 1;
    lastMutationIdRef.current[date] = id;

    // 1) Сначала помечаем дату как pending (синхронно, БЕЗ transition!)
    setPendingSet((prev) => new Set(prev).add(date));

    // 2) Применяем оптимистичное изменение внутри startTransition
    startTransition(() => {
      applyCompletion({ date, completed: checked });
    });

    // 3) делаем реальную мутацию
    try {
      await setCompletion(habitId, date, checked);

      // если это последняя мутация для этой даты — снимаем pending
      if (lastMutationIdRef.current[date] === id) {
        setPendingSet((prev) => {
          const next = new Set(prev);
          next.delete(date);
          return next;
        });
      }
    } catch (err) {
      // игнорируем устаревшие ошибки
      if (lastMutationIdRef.current[date] !== id) return;

      // Откат оптимистичного апдейта + снять pending
      startTransition(() => {
        applyCompletion({ date, completed: !checked });
      });

      setPendingSet((prev) => {
        const next = new Set(prev);
        next.delete(date);
        return next;
      });

      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    }
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="text-sm text-red-500 p-2 bg-red-50 rounded border border-red-200">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {dates.map((date) => {
          const isCompleted = optimisticCompletions.has(date);
          const isPendingForDate = pendingSet.has(date);

          return (
            <div
              key={date}
              className={`flex items-center justify-between h-10 px-2 rounded-lg transition-colors ${
                isPendingForDate ? 'bg-blue-50' : 'hover:bg-accent'
              }`}
            >
              <label
                htmlFor={`completion-${date}`}
                className={`flex-1 h-full content-center ${
                  isPendingForDate ? 'cursor-wait opacity-60' : 'cursor-pointer'
                }`}
              >
                {formatDateDisplay(date)}
              </label>

              <Checkbox
                id={`completion-${date}`}
                className={isPendingForDate ? 'cursor-wait' : 'cursor-pointer'}
                checked={isCompleted}
                onCheckedChange={(checked) => handleChange(date, checked === true)}
                // дизейблим конкретную дату в pending
                disabled={isPendingForDate}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
