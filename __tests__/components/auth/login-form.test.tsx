import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { LoginForm } from '@/components/auth/login-form'

vi.mock('@/app/actions/auth', () => ({
  login: vi.fn(),
}))

describe('LoginForm', () => {
  it('renders login form with all fields', () => {
    render(<LoginForm />)
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/пароль/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /войти/i })).toBeInTheDocument()
  })

  it('has link to signup page', () => {
    render(<LoginForm />)
    
    const signupLink = screen.getByRole('link', { name: /зарегистрироваться/i })
    expect(signupLink).toHaveAttribute('href', '/signup')
  })

  it('requires email and password fields', () => {
    render(<LoginForm />)
    
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/пароль/i)
    
    expect(emailInput).toBeRequired()
    expect(passwordInput).toBeRequired()
  })
})

