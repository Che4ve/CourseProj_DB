'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import type { Habit, HabitCheckin, Tag } from '@/lib/typeDefinitions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { HabitForm } from './HabitForm';
import { HabitTracker } from './HabitTracker';
import { deleteHabit } from '@/app/actions/habitActions';
import { calculateStreak, formatDate } from '@/lib/utils/dateUtils';
import { LucideCalendar } from 'lucide-react';
import { TagBadge } from '@/components/tags/TagBadge';
import { ScheduleForm } from '@/components/schedules/ScheduleForm';
import { ScheduleList } from '@/components/schedules/ScheduleList';
import { ReminderForm } from '@/components/reminders/ReminderForm';
import { ReminderList } from '@/components/reminders/ReminderList';

interface HabitCardProps {
  habit: Habit;
  completions: HabitCheckin[];
  allTags: Tag[];
}

export function HabitCard({ habit, completions, allTags }: HabitCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [trackerOpen, setTrackerOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [trackerPending, setTrackerPending] = useState(false);
  const [closeTrackerConfirmOpen, setCloseTrackerConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const completionDates = completions.map((c) => formatDate(new Date(c.checkinDate)));
  const streak = habit.stats?.currentStreak ?? calculateStreak(completionDates);
  const completionRateRaw = habit.stats?.completionRate;
  const completionRateParsed =
    completionRateRaw === null || completionRateRaw === undefined
      ? null
      : Number(completionRateRaw);
  const completionRate =
    completionRateParsed !== null && Number.isNaN(completionRateParsed) ? null : completionRateParsed;
  const habitTags =
    habit.tags?.map((tagLink) => tagLink.tag).filter((tag): tag is Tag => Boolean(tag)) ?? [];
  const schedules = habit.schedules ?? [];
  const reminders = habit.reminders ?? [];

  // Обработчик для попытки закрыть модалку трекера
  const handleTrackerOpenChange = (open: boolean) => {
    // Если пытаемся закрыть, но есть pending операции - показываем диалог подтверждения
    if (!open && trackerPending) {
      setCloseTrackerConfirmOpen(true);
      return;
    }
    setTrackerOpen(open);
  };

  // Подтверждение закрытия трекера
  const handleConfirmCloseTracker = () => {
    setTrackerOpen(false);
  };

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteHabit(habit.id);
    } catch (err) {
      console.error('Ошибка при удалении привычки:', err);
      toast.error(err instanceof Error ? err.message : 'Не удалось удалить привычку');
      setDeleting(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg">{habit.name}</CardTitle>
            <div className="flex gap-2 items-center">
              {habit.type === 'good' ? (
                <Badge>Хорошая</Badge>
              ) : (
                <Badge className="bg-rose-100 text-rose-700 border border-rose-200">Плохая</Badge>
              )}
              {streak > 0 && (
                <Badge variant="outline">
                  🔥 {streak} {streak === 1 ? 'день' : streak < 5 ? 'дня' : 'дней'}
                </Badge>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <span className="text-lg">⋮</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>Изменить</DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setDeleteConfirmOpen(true)}
                disabled={deleting}
                className="text-rose-600 focus:text-rose-600"
              >
                {deleting ? 'Удаление...' : 'Удалить'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {habit.description && (
          <p className="text-sm text-muted-foreground">{habit.description}</p>
        )}

        {habitTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {habitTags.map((tag) => (
              <TagBadge key={tag.id} tag={tag} />
            ))}
          </div>
        )}

        {(completionRate !== null || habit.stats?.longestStreak) && (
          <div className="flex flex-wrap gap-2 text-sm">
            {completionRate !== null && (
              <Badge variant="outline">✅ {completionRate.toFixed(1)}%</Badge>
            )}
            {habit.stats?.longestStreak ? (
              <Badge variant="outline">
                Лучшая серия: {habit.stats.longestStreak} дней
              </Badge>
            ) : null}
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Расписание</span>
            <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">Добавить</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Новое расписание</DialogTitle>
                </DialogHeader>
                <ScheduleForm habitId={habit.id} onSuccess={() => setScheduleOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
          <ScheduleList habitId={habit.id} schedules={schedules} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Напоминания</span>
            <Dialog open={reminderOpen} onOpenChange={setReminderOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">Добавить</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Новое напоминание</DialogTitle>
                </DialogHeader>
                <ReminderForm habitId={habit.id} onSuccess={() => setReminderOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
          <ReminderList habitId={habit.id} reminders={reminders} />
        </div>

        <Dialog open={trackerOpen} onOpenChange={handleTrackerOpenChange}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <LucideCalendar /> Трекинг
            </Button>
          </DialogTrigger>
          <DialogContent className={trackerPending ? 'pointer-events-auto' : ''}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">{habit.name}</DialogTitle>
            </DialogHeader>
            <HabitTracker
              habitId={habit.id}
              completions={completions}
              onPendingChange={setTrackerPending}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Изменить привычку</DialogTitle>
            </DialogHeader>
            <HabitForm habit={habit} tags={allTags} onSuccess={() => setEditOpen(false)} />
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={closeTrackerConfirmOpen}
          onOpenChange={setCloseTrackerConfirmOpen}
          title="Закрыть окно трекера?"
          description="Изменения еще сохраняются. Несохраненные изменения могут быть потеряны."
          confirmText="Закрыть"
          cancelText="Отмена"
          onConfirm={handleConfirmCloseTracker}
          variant="default"
        />

        <ConfirmDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          title="Удалить привычку?"
          description="Вы уверены, что хотите удалить эту привычку? Это действие нельзя отменить."
          confirmText="Удалить"
          cancelText="Отмена"
          onConfirm={handleDelete}
          variant="destructive"
        />
      </CardContent>
    </Card>
  );
}
