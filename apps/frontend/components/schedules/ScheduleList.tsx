'use client';

import { useState } from 'react';
import type { HabitSchedule } from '@/lib/typeDefinitions';
import { deleteSchedule } from '@/app/actions/scheduleActions';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { ScheduleBadge } from './ScheduleBadge';
import { ScheduleForm } from './ScheduleForm';

interface ScheduleListProps {
  habitId: string;
  schedules: HabitSchedule[];
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('ru-RU');
}

export function ScheduleList({ habitId, schedules }: ScheduleListProps) {
  const [editId, setEditId] = useState<string | null>(null);

  if (schedules.length === 0) {
    return <p className="text-sm text-muted-foreground">Расписаний пока нет</p>;
  }

  return (
    <div className="space-y-3">
      {schedules.map((schedule) => (
        <div
          key={schedule.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
        >
          <div className="space-y-1">
            <ScheduleBadge schedule={schedule} />
            <p className="text-xs text-muted-foreground">
              {formatDate(schedule.startDate)} – {formatDate(schedule.endDate)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Dialog open={editId === schedule.id} onOpenChange={(open) => setEditId(open ? schedule.id : null)}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">Редактировать</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Редактировать расписание</DialogTitle>
                </DialogHeader>
                <ScheduleForm
                  habitId={habitId}
                  schedule={schedule}
                  onSuccess={() => setEditId(null)}
                />
              </DialogContent>
            </Dialog>
            <form action={deleteSchedule.bind(null, schedule.id, habitId)}>
              <Button size="sm" variant="destructive" type="submit">
                Удалить
              </Button>
            </form>
          </div>
        </div>
      ))}
    </div>
  );
}
