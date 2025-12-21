'use client';

import { useState } from 'react';
import type { UserProfileResponse } from '@/lib/typeDefinitions';
import { updateProfile } from '@/app/actions/profileActions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

interface ProfileFormProps {
  profile: UserProfileResponse;
}

function toDateInput(value?: string | null) {
  if (!value) return '';
  return value.slice(0, 10);
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    setError(null);

    try {
      await updateProfile(formData);
      setSaving(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось обновить профиль');
      setSaving(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Имя</Label>
        <Input id="fullName" name="fullName" defaultValue={profile.fullName} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">О себе</Label>
        <textarea
          id="bio"
          name="bio"
          defaultValue={profile.profile?.bio ?? ''}
          className="min-h-[90px] w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="avatarUrl">Аватар (URL)</Label>
          <Input
            id="avatarUrl"
            name="avatarUrl"
            type="url"
            defaultValue={profile.profile?.avatarUrl ?? ''}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="timezone">Часовой пояс</Label>
          <Input
            id="timezone"
            name="timezone"
            defaultValue={profile.profile?.timezone ?? 'UTC'}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Дата рождения</Label>
          <Input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            defaultValue={toDateInput(profile.profile?.dateOfBirth)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="themePreference">Тема</Label>
          <select
            id="themePreference"
            name="themePreference"
            defaultValue={String(profile.profile?.themePreference ?? 0)}
            className="h-9 w-full rounded-md border border-border bg-transparent px-3 text-sm"
          >
            <option value="0">Светлая</option>
            <option value="1">Темная</option>
            <option value="2">Системная</option>
          </select>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="notificationEnabled"
          defaultChecked={profile.profile?.notificationEnabled ?? true}
        />
        Уведомления включены
      </label>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <Button type="submit" disabled={saving}>
        {saving ? 'Сохранение...' : 'Сохранить профиль'}
      </Button>
    </form>
  );
}
