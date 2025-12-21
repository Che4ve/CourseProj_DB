'use server';

import { revalidateTag } from 'next/cache';
import { serverProfileApi } from '@/lib/auth/server-api';
import type { UserProfileResponse } from '@/lib/typeDefinitions';

export async function getProfile(): Promise<UserProfileResponse> {
  try {
    return await serverProfileApi.getProfile();
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw new Error('Не удалось загрузить профиль');
  }
}

export async function updateProfile(formData: FormData) {
  const fullName = (formData.get('fullName') as string | null)?.trim();
  const bio = (formData.get('bio') as string | null) || undefined;
  const avatarUrl = (formData.get('avatarUrl') as string | null) || undefined;
  const timezone = (formData.get('timezone') as string | null) || undefined;
  const dateOfBirth = (formData.get('dateOfBirth') as string | null) || undefined;
  const notificationEnabled = formData.has('notificationEnabled');
  const themePreferenceRaw = formData.get('themePreference') as string | null;
  const themePreference = themePreferenceRaw ? Number(themePreferenceRaw) : undefined;

  try {
    await serverProfileApi.updateProfile({
      fullName: fullName || undefined,
      bio,
      avatarUrl,
      timezone,
      dateOfBirth: dateOfBirth || null,
      notificationEnabled,
      themePreference,
    });
    revalidateTag('profile');
  } catch (error) {
    console.error('Error updating profile:', error);
    throw new Error('Не удалось обновить профиль');
  }
}
