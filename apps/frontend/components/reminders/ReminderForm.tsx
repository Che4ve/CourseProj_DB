'use client';

import { useState } from 'react';
import type { Reminder } from '@/lib/typeDefinitions';
import { createReminder, updateReminder } from '@/app/actions/reminderActions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { ALL_WEEKDAYS_MASK, WEEKDAY_OPTIONS } from '@/lib/utils/weekdayMask';
import { Bell, CalendarDays, Clock, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReminderFormProps {
  habitId: string;
  reminder?: Reminder;
  onSuccess?: () => void;
}

function toTimeInput(value?: string | null) {
  if (!value) return '';
  const match = value.match(/\d{2}:\d{2}/);
  return match ? match[0] : '';
}

export function ReminderForm({ habitId, reminder, onSuccess }: ReminderFormProps) {
  const [weekdaysMask, setWeekdaysMask] = useState(
    reminder?.daysOfWeek ?? ALL_WEEKDAYS_MASK
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
    formData.set('daysOfWeek', String(weekdaysMask));

    try {
      if (reminder) {
        await updateReminder(reminder.id, habitId, formData);
      } else {
        await createReminder(formData);
      }
      setSubmitting(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить напоминание');
      setSubmitting(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <input type="hidden" name="habitId" value={habitId} />
      <input type="hidden" name="daysOfWeek" value={weekdaysMask} />

      <div className="space-y-2">
        <Label htmlFor="reminderTime" className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          Время
        </Label>
        <Input
          id="reminderTime"
          name="reminderTime"
          type="time"
          defaultValue={toTimeInput(reminder?.reminderTime)}
          required
        />
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

      <div className="space-y-2">
        <Label htmlFor="notificationText" className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-muted-foreground" />
          Текст уведомления
        </Label>
        <Input
          id="notificationText"
          name="notificationText"
          placeholder="Например: Пора отметить привычку"
          defaultValue={reminder?.notificationText ?? ''}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="deliveryMethod" className="flex items-center gap-2">
          <Send className="h-4 w-4 text-muted-foreground" />
          Способ доставки
        </Label>
        <select
          id="deliveryMethod"
          name="deliveryMethod"
          defaultValue={reminder?.deliveryMethod ?? 'push'}
          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm shadow-sm"
        >
          <option value="push">Push</option>
          <option value="email">Email</option>
          <option value="sms">SMS</option>
        </select>
      </div>

      <label className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
        <span className="font-medium">Активно</span>
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={reminder?.isActive ?? true}
          className="h-4 w-4 rounded border border-border"
        />
      </label>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? 'Сохранение...' : reminder ? 'Сохранить изменения' : 'Добавить напоминание'}
      </Button>
    </form>
  );
}
