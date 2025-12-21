'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import type { Habit, HabitCompletion } from '@/lib/typeDefinitions';
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
import { calculateStreak } from '@/lib/utils/dateUtils';
import { LucideCalendar } from 'lucide-react';

interface HabitCardProps {
  habit: Habit;
  completions: HabitCompletion[];
}

export function HabitCard({ habit, completions }: HabitCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [trackerOpen, setTrackerOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [trackerPending, setTrackerPending] = useState(false);
  const [closeTrackerConfirmOpen, setCloseTrackerConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const streak = calculateStreak(completions.map((c) => c.completed_at));

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
      <CardContent>
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
            <HabitForm habit={habit} onSuccess={() => setEditOpen(false)} />
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
