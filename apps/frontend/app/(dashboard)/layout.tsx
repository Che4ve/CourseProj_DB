import { serverAuthApi, ApiError } from '@/lib/auth/server-api';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { DashboardTabs } from '@/components/navigation/DashboardTabs';
import { ProfileNavButton } from '@/components/navigation/ProfileNavButton';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user: Awaited<ReturnType<typeof serverAuthApi.getMe>>;

  try {
    user = await serverAuthApi.getMe();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return (
        <div className="min-h-screen bg-background">
          <main className="container mx-auto px-4 py-16">
            <div className="mx-auto max-w-lg rounded-lg border bg-card p-6 text-center shadow-sm">
              <h1 className="text-xl font-semibold">Сессия истекла</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Похоже, пользователь больше не существует или токен устарел.
                Выйдите и войдите снова.
              </p>
              <div className="mt-4 flex justify-center">
                <LogoutButton />
              </div>
            </div>
          </main>
        </div>
      );
    }

    throw error;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="grid items-center gap-4 lg:grid-cols-[1fr_auto_1fr]">
            <div>
              <h1 className="text-2xl font-bold">Трекер привычек</h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <div className="flex justify-center">
              <DashboardTabs />
            </div>
            <div className="flex justify-start lg:justify-end">
              <ProfileNavButton />
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
