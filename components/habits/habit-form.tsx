'use client'

import { useState } from 'react'
import { createHabit, updateHabit } from '@/app/actions/habits'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Habit, HabitType } from '@/lib/types'

interface HabitFormProps {
  habit?: Habit
  onSuccess: () => void
}

export function HabitForm({ habit, onSuccess }: HabitFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [type, setType] = useState<HabitType>(habit?.type || 'good')

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    const result = habit
      ? await updateHabit(habit.id, formData)
      : await createHabit(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      onSuccess()
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Название привычки</Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="Например: Пробежка утром"
          defaultValue={habit?.name}
          required
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <Label>Тип привычки</Label>
        <input type="hidden" name="type" value={type} />
        <div className="flex gap-2">
          <Button
            type="button"
            variant={type === 'good' ? 'default' : 'outline'}
            onClick={() => setType('good')}
            disabled={loading}
            className="flex-1"
          >
            Хорошая
          </Button>
          <Button
            type="button"
            variant={type === 'bad' ? 'default' : 'outline'}
            onClick={() => setType('bad')}
            disabled={loading}
            className="flex-1"
          >
            Плохая
          </Button>
        </div>
      </div>
      {error && <div className="text-sm text-red-500">{error}</div>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Сохранение...' : habit ? 'Обновить' : 'Создать'}
      </Button>
    </form>
  )
}

