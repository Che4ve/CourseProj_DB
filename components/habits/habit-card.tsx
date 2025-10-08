'use client'

import { useState } from 'react'
import { Habit, HabitCompletion } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { HabitForm } from './habit-form'
import { HabitTracker } from './habit-tracker'
import { deleteHabit } from '@/app/actions/habits'
import { calculateStreak } from '@/lib/utils/date'

interface HabitCardProps {
  habit: Habit
  completions: HabitCompletion[]
}

export function HabitCard({ habit, completions }: HabitCardProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [trackerOpen, setTrackerOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const streak = calculateStreak(completions.map(c => c.completed_at))

  async function handleDelete() {
    if (!confirm('Вы уверены, что хотите удалить эту привычку?')) return
    
    setDeleting(true)
    await deleteHabit(habit.id)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{habit.name}</CardTitle>
            <div className="flex gap-2 items-center">
              <Badge variant={habit.type === 'good' ? 'default' : 'destructive'}>
                {habit.type === 'good' ? 'Хорошая' : 'Плохая'}
              </Badge>
              {streak > 0 && (
                <Badge variant="outline">🔥 {streak} {streak === 1 ? 'день' : streak < 5 ? 'дня' : 'дней'}</Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex gap-2">
          <Dialog open={trackerOpen} onOpenChange={setTrackerOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1">
                Трекинг
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{habit.name}</DialogTitle>
              </DialogHeader>
              <HabitTracker habitId={habit.id} completions={completions} />
            </DialogContent>
          </Dialog>

          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1">
                Изменить
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Изменить привычку</DialogTitle>
              </DialogHeader>
              <HabitForm habit={habit} onSuccess={() => setEditOpen(false)} />
            </DialogContent>
          </Dialog>

          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1"
          >
            {deleting ? 'Удаление...' : 'Удалить'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

