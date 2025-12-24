import { getProfile } from '@/app/actions/profileActions';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { ProfileView } from '@/components/profile/ProfileView';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default async function ProfilePage() {
  const profile = await getProfile();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Профиль</h1>
        <p className="text-sm text-muted-foreground">
          Обновите личные данные, настройки уведомлений и тему интерфейса.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <ProfileView profile={profile} />
        <ProfileForm profile={profile} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Сессия</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Выйти из аккаунта</p>
            <p className="text-sm text-muted-foreground">
              Завершите текущую сессию на этом устройстве.
            </p>
          </div>
          <LogoutButton />
        </CardContent>
      </Card>
    </div>
  );
}
