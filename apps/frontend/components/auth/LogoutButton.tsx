'use client';

import { logout } from '@/app/actions/authActions';
import { Button } from '@/components/ui/Button';

export function LogoutButton() {
  return (
    <form action={logout}>
      <Button type="submit" variant="outline">
        Выход
      </Button>
    </form>
  );
}
