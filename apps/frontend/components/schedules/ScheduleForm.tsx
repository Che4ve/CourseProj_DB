'use client';

import { useState } from 'react';
import type { HabitSchedule } from '@/lib/typeDefinitions';
import { createSchedule, updateSchedule } from '@/app/actions/scheduleActions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { ALL_WEEKDAYS_MASK, WEEKDAY_OPTIONS } from '@/lib/utils/weekdayMask';

interface ScheduleFormProps {
  habitId: string;
  schedule?: HabitSchedule;
  onSuccess?: () => void;
}

function toDateInput(value?: string | null) {
  if (!value) return '';
  return value.slice(0, 10);
}

export function ScheduleForm({ habitId, schedule, onSuccess }: ScheduleFormProps) {
  const [weekdaysMask, setWeekdaysMask] = useState(
    schedule?.weekdaysMask ?? ALL_WEEKDAYS_MASK
  );

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleToggleDay = (bit: number) => {
    setWeekdaysMask((prev) => (prev ^ bit));
  };

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setError(null);

    formData.set('habitId', habitId);
    formData.set('weekdaysMask', String(weekdaysMask));

    try {
      if (schedule) {
        await updateSchedule(schedule.id, habitId, formData);
      } else {
        await createSchedule(formData);
      }
      setSubmitting(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить расписание');
      setSubmitting(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <input type="hidden" name="habitId" value={habitId} />
      <input type="hidden" name="weekdaysMask" value={weekdaysMask} />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="frequencyType">Тип частоты</Label>
          <select
            id="frequencyType"
            name="frequencyType"
            defaultValue={schedule?.frequencyType ?? 'daily'}
            className="h-9 w-full rounded-md border border-border bg-transparent px-3 text-sm"
          >
            <option value="daily">Ежедневно</option>
            <option value="weekly">Еженедельно</option>
            <option value="monthly">Ежемесячно</option>
            <option value="custom">Пользовательский</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="frequencyValue">Значение частоты</Label>
          <Input
            id="frequencyValue"
            name="frequencyValue"
            type="number"
            min="1"
            defaultValue={schedule?.frequencyValue ?? 1}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Дни недели</Label>
        <div className="flex flex-wrap gap-2">
          {WEEKDAY_OPTIONS.map((day) => {
            const checked = (weekdaysMask & day.bit) !== 0;
            return (
              <label key={day.bit} className="flex items-center gap-2 rounded border px-2 py-1">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => handleToggleDay(day.bit)}
                />
                <span className="text-sm">{day.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate">Дата начала</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={toDateInput(schedule?.startDate) || toDateInput(new Date().toISOString())}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">Дата окончания</Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            defaultValue={toDateInput(schedule?.endDate)}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isActive" defaultChecked={schedule?.isActive ?? true} />
        Активно
      </label>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? 'Сохранение...' : schedule ? 'Сохранить изменения' : 'Добавить расписание'}
      </Button>
    </form>
  );
}
