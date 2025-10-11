export type HabitType = 'good' | 'bad';

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  type: HabitType;
  created_at: string;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  completed_at: string;
}

export interface HabitWithCompletions extends Habit {
  completions: HabitCompletion[];
}
