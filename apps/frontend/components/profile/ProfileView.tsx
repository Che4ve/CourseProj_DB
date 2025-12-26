import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { UserProfileResponse } from '@/lib/typeDefinitions';
import { formatDateDisplay } from '@/lib/utils/dateUtils';

interface ProfileViewProps {
  profile: UserProfileResponse;
}

export function ProfileView({ profile }: ProfileViewProps) {
  const summary = profile.summary;

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
        {summary ? (
          <>
            <div className="border-t pt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Статистика
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Всего привычек</span>
              <span className="font-medium">{summary.totalHabits}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Хороших</span>
              <span className="font-medium">{summary.goodHabits}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Плохих</span>
              <span className="font-medium">{summary.badHabits}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Отметок</span>
              <span className="font-medium">{summary.totalCheckins}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Последняя активность</span>
              <span className="font-medium">
                {summary.lastActivity ? formatDateDisplay(summary.lastActivity) : '—'}
              </span>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
