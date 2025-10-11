import { getHabits } from '@/app/actions/habitActions';
import { getCompletions } from '@/app/actions/completionActions';
import { HabitCard } from './HabitCard';

export async function HabitList() {
  const habits = await getHabits();

  if (habits.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>У вас пока нет привычек</p>
        <p className="text-sm">Создайте первую привычку, чтобы начать трекинг</p>
      </div>
    );
  }

  const habitsWithCompletions = await Promise.all(
    habits.map(async (habit) => {
      const completions = await getCompletions(habit.id);
      return { habit, completions };
    })
  );

  const goodHabits = habitsWithCompletions.filter(({ habit }) => habit.type === 'good');
  const badHabits = habitsWithCompletions.filter(({ habit }) => habit.type === 'bad');

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_1px_1fr] items-start">
      {/* Хорошие привычки */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Хорошие привычки</h2>
          <span className="text-sm text-muted-foreground">({goodHabits.length})</span>
        </div>
        {goodHabits.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
            <p className="text-sm">Пока нет хороших привычек</p>
          </div>
        ) : (
          <div className="space-y-4">
            {goodHabits.map(({ habit, completions }) => (
              <HabitCard key={habit.id} habit={habit} completions={completions} />
            ))}
          </div>
        )}
      </div>

      {/* Вертикальный разделитель */}
      <div className="hidden md:block h-full w-px bg-border" aria-hidden />

      {/* Плохие привычки */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Плохие привычки</h2>
          <span className="text-sm text-muted-foreground">({badHabits.length})</span>
        </div>
        {badHabits.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
            <p className="text-sm">Пока нет плохих привычек</p>
          </div>
        ) : (
          <div className="space-y-4">
            {badHabits.map(({ habit, completions }) => (
              <HabitCard key={habit.id} habit={habit} completions={completions} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
