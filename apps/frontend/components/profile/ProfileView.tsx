import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { UserProfileResponse } from '@/lib/typeDefinitions';

interface ProfileViewProps {
  profile: UserProfileResponse;
}

export function ProfileView({ profile }: ProfileViewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Профиль</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Email</span>
          <span className="font-medium">{profile.email}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Имя</span>
          <span className="font-medium">{profile.fullName}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Роль</span>
          <span className="font-medium">{profile.role}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Статус</span>
          <span className="font-medium">{profile.isActive ? 'Активен' : 'Неактивен'}</span>
        </div>
      </CardContent>
    </Card>
  );
}
