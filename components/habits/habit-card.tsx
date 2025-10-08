'use client'

import { useState } from 'react'
import { Habit, HabitCompletion } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { HabitForm } from './habit-form'
import { HabitTracker } from './habit-tracker'
import { deleteHabit } from '@/app/actions/habits'
import { calculateStreak } from '@/lib/utils/date'
import { LucideCalendar, LucideCalendar1, LucideChartBar, TrainTrackIcon } from 'lucide-react'

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
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg">{habit.name}</CardTitle>
            <div className="flex gap-2 items-center">
              {habit.type === 'good' ? (
                <Badge>Хорошая</Badge>
              ) : (
                <Badge className="bg-rose-100 text-rose-700 border border-rose-200">Плохая</Badge>
              )}
              {streak > 0 && (
                <Badge variant="outline">🔥 {streak} {streak === 1 ? 'день' : streak < 5 ? 'дня' : 'дней'}</Badge>
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
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                Изменить
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleDelete}
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
        <Dialog open={trackerOpen} onOpenChange={setTrackerOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <LucideCalendar /> Трекинг
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Изменить привычку</DialogTitle>
            </DialogHeader>
            <HabitForm habit={habit} onSuccess={() => setEditOpen(false)} />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

