import { Suspense } from 'react'
import { HabitList } from '@/components/habits/habit-list'
import { CreateHabitButton } from '@/components/habits/create-habit-button'
import { LogoutButton } from '@/components/auth/logout-button'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Трекер привычек</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
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
  )
}

