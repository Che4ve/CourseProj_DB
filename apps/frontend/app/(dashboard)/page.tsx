import { Suspense } from 'react';
import { HabitList } from '@/components/habits/HabitList';
import { CreateHabitButton } from '@/components/habits/CreateHabitButton';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { serverAuthApi } from '@/lib/auth/server-api';

export default async function DashboardPage() {
  const user = await serverAuthApi.getMe();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Трекер привычек</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <div className="flex gap-2">
            <CreateHabitButton />
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Suspense fallback={<div className="text-center py-12">Загрузка...</div>}>
          <HabitList />
        </Suspense>
      </main>
    </div>
  );
}
