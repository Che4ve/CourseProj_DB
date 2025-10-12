import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoginForm } from '@/components/auth/LoginForm';

vi.mock('@/app/actions/auth', () => ({
  login: vi.fn(),
}));

describe('LoginForm', () => {
  it('renders login form with all fields', () => {
    render(<LoginForm />);

    expect(screen.getByPlaceholderText(/your@email.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /войти/i })).toBeInTheDocument();
  });

  it('has link to signup page', () => {
    render(<LoginForm />);

    const signupLink = screen.getByRole('link', { name: /зарегистрироваться/i });
    expect(signupLink).toHaveAttribute('href', '/signup');
  });

  it('requires email and password fields', () => {
    render(<LoginForm />);

    const emailInput = screen.getByPlaceholderText(/your@email.com/i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);

    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
  });
});
