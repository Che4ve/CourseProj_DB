'use client';

import { useId, useState } from 'react';
import { signup } from '@/app/actions/authActions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Link from 'next/link';

export function SignupForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fullNameFieldId = useId();
  const emailFieldId = useId();
  const passwordFieldId = useId();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await signup(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Регистрация</CardTitle>
        <CardDescription>Создайте аккаунт для отслеживания привычек</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={fullNameFieldId}>Имя</Label>
            <Input
              id={fullNameFieldId}
              name="fullName"
              type="text"
              placeholder="Иван Иванов"
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={emailFieldId}>Email</Label>
            <Input
              id={emailFieldId}
              name="email"
              type="email"
              placeholder="your@email.com"
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={passwordFieldId}>Пароль</Label>
            <Input
              id={passwordFieldId}
              name="password"
              type="password"
              placeholder="••••••••"
              required
              minLength={6}
              disabled={loading}
            />
          </div>
          {error && <div className="text-sm text-red-500">{error}</div>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </Button>
          <div className="text-center text-sm">
            Уже есть аккаунт?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Войти
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
