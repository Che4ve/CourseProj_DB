'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog';
import { HabitForm } from './HabitForm';

export function CreateHabitButton() {
  const [open, setOpen] = useState(false);

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
  );
}
