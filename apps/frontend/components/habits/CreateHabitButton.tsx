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
import type { Tag } from '@/lib/typeDefinitions';

interface CreateHabitButtonProps {
  tags?: Tag[];
}

export function CreateHabitButton({ tags = [] }: CreateHabitButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Создать привычку</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Новая привычка</DialogTitle>
        </DialogHeader>
        <HabitForm tags={tags} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
