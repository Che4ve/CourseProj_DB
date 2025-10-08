'use client'

import { useOptimistic, useState, useTransition } from 'react'
import { HabitCompletion } from '@/lib/types'
import { Checkbox } from '@/components/ui/checkbox'
import { toggleCompletion } from '@/app/actions/completions'
import { getLast14Days, formatDateDisplay } from '@/lib/utils/date'

interface HabitTrackerProps {
  habitId: string
  completions: HabitCompletion[]
}

export function HabitTracker({ habitId, completions }: HabitTrackerProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const dates = getLast14Days()
  const [optimisticCompletions, setOptimisticCompletions] = useOptimistic(
    new Set(completions.map(c => c.completed_at)),
    (state: Set<string>, action: { date: string }) => {
      const next = new Set(state)
      if (next.has(action.date)) {
        next.delete(action.date)
      } else {
        next.add(action.date)
      }
      return next
    }
  )

  function handleToggle(date: string) {
    setError(null)
    setOptimisticCompletions({ date })
    startTransition(async () => {
      const result = await toggleCompletion(habitId, date)
      if (result?.error) {
        setError(result.error)
        // откатываем оптимизм
        setOptimisticCompletions({ date })
      }
    })
  }

  return (
    <div className="space-y-3">
      {error && <div className="text-sm text-red-500">{error}</div>}
      <div className="space-y-2">
        {dates.map((date) => {
          const isCompleted = optimisticCompletions.has(date)
          return (
            <div
              key={date}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-accent"
            >
              <label
                htmlFor={`completion-${date}`}
                className="flex-1 cursor-pointer"
              >
                {formatDateDisplay(date)}
              </label>
              <Checkbox
                id={`completion-${date}`}
                checked={isCompleted}
                onCheckedChange={() => handleToggle(date)}
                disabled={isPending}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

