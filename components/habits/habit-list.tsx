import { getHabits } from '@/app/actions/habits'
import { getCompletions } from '@/app/actions/completions'
import { HabitCard } from './habit-card'

export async function HabitList() {
  const habits = await getHabits()

  if (habits.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>У вас пока нет привычек</p>
        <p className="text-sm">Создайте первую привычку, чтобы начать трекинг</p>
      </div>
    )
  }

  const habitsWithCompletions = await Promise.all(
    habits.map(async (habit) => {
      const completions = await getCompletions(habit.id)
      return { habit, completions }
    })
  )

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {habitsWithCompletions.map(({ habit, completions }) => (
        <HabitCard key={habit.id} habit={habit} completions={completions} />
      ))}
    </div>
  )
}

