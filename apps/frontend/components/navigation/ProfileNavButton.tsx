'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export function ProfileNavButton() {
  const pathname = usePathname();
  const isActive = pathname.startsWith('/profile');

  return (
    <Button
      asChild
      size="icon"
      variant="ghost"
      className={cn(
        'h-11 w-11 rounded-full border border-border bg-muted/40 text-muted-foreground shadow-sm hover:bg-background hover:text-foreground',
        isActive && 'bg-background text-foreground'
      )}
    >
      <Link
        href="/profile"
        aria-current={isActive ? 'page' : undefined}
        aria-label="Профиль"
        title="Профиль"
      >
        <User className="h-5 w-5" />
      </Link>
    </Button>
  );
}
