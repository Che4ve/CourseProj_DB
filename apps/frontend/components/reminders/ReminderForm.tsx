'use client';

import { useState } from 'react';
import type { Reminder } from '@/lib/typeDefinitions';
import { createReminder, updateReminder } from '@/app/actions/reminderActions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { ALL_WEEKDAYS_MASK, WEEKDAY_OPTIONS } from '@/lib/utils/weekdayMask';

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
    <form action={handleSubmit} className="space-y-4">
      <input type="hidden" name="habitId" value={habitId} />
      <input type="hidden" name="daysOfWeek" value={weekdaysMask} />

      <div className="space-y-2">
        <Label htmlFor="reminderTime">Время</Label>
        <Input
          id="reminderTime"
          name="reminderTime"
          type="time"
          defaultValue={toTimeInput(reminder?.reminderTime)}
          required
        />
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

      <div className="space-y-2">
        <Label htmlFor="notificationText">Текст уведомления</Label>
        <Input
          id="notificationText"
          name="notificationText"
          placeholder="Например: Пора отметить привычку"
          defaultValue={reminder?.notificationText ?? ''}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="deliveryMethod">Способ доставки</Label>
        <select
          id="deliveryMethod"
          name="deliveryMethod"
          defaultValue={reminder?.deliveryMethod ?? 'push'}
          className="h-9 w-full rounded-md border border-border bg-transparent px-3 text-sm"
        >
          <option value="push">Push</option>
          <option value="email">Email</option>
          <option value="sms">SMS</option>
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="isActive" defaultChecked={reminder?.isActive ?? true} />
        Активно
      </label>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? 'Сохранение...' : reminder ? 'Сохранить изменения' : 'Добавить напоминание'}
      </Button>
    </form>
  );
}
