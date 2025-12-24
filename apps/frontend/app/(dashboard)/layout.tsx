import { serverAuthApi } from '@/lib/auth/server-api';
import { DashboardTabs } from '@/components/navigation/DashboardTabs';
import { ProfileNavButton } from '@/components/navigation/ProfileNavButton';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await serverAuthApi.getMe();

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
