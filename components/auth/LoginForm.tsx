'use client';

import { useState } from 'react';
import { login } from '@/app/actions/authActions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import Link from 'next/link';

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await login(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Вход</CardTitle>
        <CardDescription>Войдите в свой аккаунт</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              name="email"
              type="email"
              placeholder="your@email.com"
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <Input
              name="password"
              type="password"
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>
          {error && <div className="text-sm text-red-500">{error}</div>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </Button>
          <div className="text-center text-sm">
            Нет аккаунта?{' '}
            <Link href="/signup" className="text-primary hover:underline">
              Зарегистрироваться
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
