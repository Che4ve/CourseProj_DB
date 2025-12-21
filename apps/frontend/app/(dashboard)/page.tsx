import { Suspense } from 'react';
import { HabitList } from '@/components/habits/HabitList';
import { CreateHabitButton } from '@/components/habits/CreateHabitButton';
import { getTags } from '@/app/actions/tagActions';

export default async function DashboardPage() {
  const tags = await getTags();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Мои привычки</h2>
          <p className="text-sm text-muted-foreground">Создавайте, отслеживайте и анализируйте.</p>
        </div>
        <CreateHabitButton tags={tags} />
      </div>
      <Suspense fallback={<div className="text-center py-12">Загрузка...</div>}>
        <HabitList />
      </Suspense>
    </div>
  );
}
