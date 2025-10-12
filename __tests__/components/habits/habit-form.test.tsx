import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { HabitForm } from '@/components/habits/HabitForm';
import type { Habit } from '@/lib/typeDefinitions';

vi.mock('@/app/actions/habits', () => ({
  createHabit: vi.fn(),
  updateHabit: vi.fn(),
}));

describe('HabitForm', () => {
  const mockOnSuccess = vi.fn();

  it('renders create form when no habit provided', () => {
    render(<HabitForm onSuccess={mockOnSuccess} />);

    expect(screen.getByLabelText(/название привычки/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /создать/i })).toBeInTheDocument();
  });

  it('renders update form when habit provided', () => {
    const habit: Habit = {
      id: '1',
      user_id: 'user1',
      name: 'Test Habit',
      type: 'good',
      created_at: new Date().toISOString(),
    };

    render(<HabitForm habit={habit} onSuccess={mockOnSuccess} />);

    expect(screen.getByDisplayValue('Test Habit')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /обновить/i })).toBeInTheDocument();
  });

  it('has good and bad habit type buttons', () => {
    render(<HabitForm onSuccess={mockOnSuccess} />);

    expect(screen.getByRole('button', { name: /хорошая/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /плохая/i })).toBeInTheDocument();
  });

  it('requires name field', () => {
    render(<HabitForm onSuccess={mockOnSuccess} />);

    const nameInput = screen.getByLabelText(/название привычки/i);
    expect(nameInput).toBeRequired();
  });
});
