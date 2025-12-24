'use client';

import { useState } from 'react';
import type { HabitSchedule } from '@/lib/typeDefinitions';
import { createSchedule, updateSchedule } from '@/app/actions/scheduleActions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { ALL_WEEKDAYS_MASK, WEEKDAY_OPTIONS } from '@/lib/utils/weekdayMask';
import { CalendarDays, CalendarRange, Hash, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    <form action={handleSubmit} className="space-y-5">
      <input type="hidden" name="habitId" value={habitId} />
      <input type="hidden" name="weekdaysMask" value={weekdaysMask} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="frequencyType" className="flex items-center gap-2">
            <Repeat className="h-4 w-4 text-muted-foreground" />
            Тип частоты
          </Label>
          <select
            id="frequencyType"
            name="frequencyType"
            defaultValue={schedule?.frequencyType ?? 'daily'}
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm shadow-sm"
          >
            <option value="daily">Ежедневно</option>
            <option value="weekly">Еженедельно</option>
            <option value="monthly">Ежемесячно</option>
            <option value="custom">Пользовательский</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="frequencyValue" className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-muted-foreground" />
            Значение частоты
          </Label>
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
        <Label className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          Дни недели
        </Label>
        <div className="grid grid-cols-7 gap-2">
          {WEEKDAY_OPTIONS.map((day) => {
            const checked = (weekdaysMask & day.bit) !== 0;
            return (
              <button
                key={day.bit}
                type="button"
                aria-pressed={checked}
                onClick={() => handleToggleDay(day.bit)}
                className={cn(
                  'h-9 rounded-md border text-sm font-medium transition-colors',
                  checked
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                    : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                {day.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            Дата начала
          </Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={toDateInput(schedule?.startDate) || toDateInput(new Date().toISOString())}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate" className="flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-muted-foreground" />
            Дата окончания
          </Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            defaultValue={toDateInput(schedule?.endDate)}
          />
        </div>
      </div>

      <label className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
        <span className="font-medium">Активно</span>
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={schedule?.isActive ?? true}
          className="h-4 w-4 rounded border border-border"
        />
      </label>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? 'Сохранение...' : schedule ? 'Сохранить изменения' : 'Добавить расписание'}
      </Button>
    </form>
  );
}
