-- Habit Tracker Database Setup
-- Выполните этот скрипт в Supabase SQL Editor

-- Создание таблицы привычек
create table habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type text check (type in ('good', 'bad')) not null,
  created_at timestamptz default now()
);

-- Создание таблицы выполнений
create table habit_completions (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid references habits(id) on delete cascade not null,
  completed_at date not null,
  unique(habit_id, completed_at)
);

-- Включение Row Level Security
alter table habits enable row level security;
alter table habit_completions enable row level security;

-- Политики для таблицы habits
create policy "Users can view their own habits"
  on habits for select
  using (auth.uid() = user_id);

create policy "Users can create their own habits"
  on habits for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own habits"
  on habits for update
  using (auth.uid() = user_id);

create policy "Users can delete their own habits"
  on habits for delete
  using (auth.uid() = user_id);

-- Политики для таблицы habit_completions
create policy "Users can view completions for their habits"
  on habit_completions for select
  using (
    exists (
      select 1 from habits
      where habits.id = habit_completions.habit_id
      and habits.user_id = auth.uid()
    )
  );

create policy "Users can create completions for their habits"
  on habit_completions for insert
  with check (
    exists (
      select 1 from habits
      where habits.id = habit_completions.habit_id
      and habits.user_id = auth.uid()
    )
  );

create policy "Users can delete completions for their habits"
  on habit_completions for delete
  using (
    exists (
      select 1 from habits
      where habits.id = habit_completions.habit_id
      and habits.user_id = auth.uid()
    )
  );

-- Создание индексов для оптимизации запросов
create index habits_user_id_idx on habits(user_id);
create index habit_completions_habit_id_idx on habit_completions(habit_id);
create index habit_completions_completed_at_idx on habit_completions(completed_at);

