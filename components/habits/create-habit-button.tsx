'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { HabitForm } from './habit-form'

export function CreateHabitButton() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Создать привычку</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новая привычка</DialogTitle>
        </DialogHeader>
        <HabitForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

