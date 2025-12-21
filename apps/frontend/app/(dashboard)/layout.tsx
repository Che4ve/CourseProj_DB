import Link from 'next/link';
import { serverAuthApi } from '@/lib/auth/server-api';
import { LogoutButton } from '@/components/auth/LogoutButton';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await serverAuthApi.getMe();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Трекер привычек</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <nav className="flex items-center gap-3 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground">
                Привычки
              </Link>
              <Link href="/tags" className="hover:text-foreground">
                Теги
              </Link>
              <Link href="/stats" className="hover:text-foreground">
                Статистика
              </Link>
              <Link href="/profile" className="hover:text-foreground">
                Профиль
              </Link>
            </nav>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
