'use client';

import { useState } from 'react';
import type { Reminder } from '@/lib/typeDefinitions';
import { deleteReminder } from '@/app/actions/reminderActions';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog';
import { ReminderBadge } from './ReminderBadge';
import { ReminderForm } from './ReminderForm';

interface ReminderListProps {
  habitId: string;
  reminders: Reminder[];
}

export function ReminderList({ habitId, reminders }: ReminderListProps) {
  const [editId, setEditId] = useState<string | null>(null);

  if (reminders.length === 0) {
    return <p className="text-sm text-muted-foreground">Напоминаний пока нет</p>;
  }

  return (
    <div className="space-y-3">
      {reminders.map((reminder) => (
        <div
          key={reminder.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
        >
          <ReminderBadge reminder={reminder} />
          <div className="flex flex-wrap items-center gap-2">
            <Dialog
              open={editId === reminder.id}
              onOpenChange={(open) => setEditId(open ? reminder.id : null)}
            >
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 px-3 text-sm">
                  Редактировать
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Редактировать напоминание</DialogTitle>
                </DialogHeader>
                <ReminderForm
                  habitId={habitId}
                  reminder={reminder}
                  onSuccess={() => setEditId(null)}
                />
              </DialogContent>
            </Dialog>
            <form action={deleteReminder.bind(null, reminder.id, habitId)}>
              <Button
                size="sm"
                variant="outline"
                type="submit"
                className="h-8 px-3 text-sm text-rose-600 border-rose-200/70 hover:bg-rose-50 hover:text-rose-700"
              >
                Удалить
              </Button>
            </form>
          </div>
        </div>
      ))}
    </div>
  );
}
