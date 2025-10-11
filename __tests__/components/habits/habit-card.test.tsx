import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HabitCard } from '@/components/habits/habit-card';
import { Habit, HabitCompletion } from '@/lib/types';

vi.mock('@/app/actions/habits', () => ({
  deleteHabit: vi.fn(),
}));

describe('HabitCard', () => {
  const mockHabit: Habit = {
    id: '1',
    user_id: 'user1',
    name: 'Morning Run',
    type: 'good',
    created_at: new Date().toISOString(),
  };

  const mockCompletions: HabitCompletion[] = [];

  it('renders habit name', () => {
    render(<HabitCard habit={mockHabit} completions={mockCompletions} />);

    expect(screen.getByText('Morning Run')).toBeInTheDocument();
  });

  it('displays good habit badge', () => {
    render(<HabitCard habit={mockHabit} completions={mockCompletions} />);

    expect(screen.getByText(/хорошая/i)).toBeInTheDocument();
  });

  it('displays bad habit badge for bad habits', () => {
    const badHabit = { ...mockHabit, type: 'bad' as const };
    render(<HabitCard habit={badHabit} completions={mockCompletions} />);

    expect(screen.getByText(/плохая/i)).toBeInTheDocument();
  });

  it('has tracker button and menu', () => {
    render(<HabitCard habit={mockHabit} completions={mockCompletions} />);

    expect(screen.getByRole('button', { name: /трекинг/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '⋮' })).toBeInTheDocument();
  });

  it('displays streak when completions exist', () => {
    const today = new Date().toISOString().split('T')[0];
    const completions: HabitCompletion[] = [{ id: '1', habit_id: '1', completed_at: today }];

    render(<HabitCard habit={mockHabit} completions={completions} />);

    expect(screen.getByText(/🔥 1 день/)).toBeInTheDocument();
  });
});
