'use client';

import { Badge } from '@/components/ui/Badge';
import type { Reminder } from '@/lib/typeDefinitions';
import { formatWeekdays } from '@/lib/utils/weekdayMask';

interface ReminderBadgeProps {
  reminder: Reminder;
}

function formatTime(value: string) {
  const match = value.match(/\d{2}:\d{2}/);
  return match ? match[0] : value;
}

export function ReminderBadge({ reminder }: ReminderBadgeProps) {
  return (
    <Badge variant="secondary">
      {formatTime(reminder.reminderTime)} · {formatWeekdays(reminder.daysOfWeek)}
    </Badge>
  );
}
