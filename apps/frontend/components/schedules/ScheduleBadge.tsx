'use client';

import { Badge } from '@/components/ui/Badge';
import type { HabitSchedule } from '@/lib/typeDefinitions';
import { formatWeekdays } from '@/lib/utils/weekdayMask';

interface ScheduleBadgeProps {
  schedule: HabitSchedule;
}

function formatSchedule(schedule: HabitSchedule): string {
  const value = schedule.frequencyValue || 1;

  switch (schedule.frequencyType) {
    case 'daily':
      return value === 1 ? 'Каждый день' : `Каждые ${value} дня`;
    case 'weekly':
      return value === 1 ? 'Каждую неделю' : `Каждые ${value} недели`;
    case 'monthly':
      return value === 1 ? 'Каждый месяц' : `Каждые ${value} месяца`;
    case 'custom':
    default:
      return formatWeekdays(schedule.weekdaysMask);
  }
}

export function ScheduleBadge({ schedule }: ScheduleBadgeProps) {
  return <Badge variant="outline">{formatSchedule(schedule)}</Badge>;
}
