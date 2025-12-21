'use client';

import { useState, useId } from 'react';
import { createHabit, updateHabit } from '@/app/actions/habitActions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import type { Habit, HabitType } from '@/lib/typeDefinitions';

interface HabitFormProps {
  habit?: Habit;
  onSuccess: () => void;
}

export function HabitForm({ habit, onSuccess }: HabitFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<HabitType>(habit?.type || 'good');
  const nameId = useId();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    try {
      if (habit) {
        await updateHabit(habit.id, formData);
      } else {
        await createHabit(formData);
      }
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={nameId}>Название привычки</Label>
        <Input
          id={nameId}
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
  );
}
