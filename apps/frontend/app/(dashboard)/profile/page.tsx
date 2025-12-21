import { getProfile } from '@/app/actions/profileActions';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { ProfileView } from '@/components/profile/ProfileView';

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
    </div>
  );
}
