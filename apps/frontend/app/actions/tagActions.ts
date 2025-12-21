'use server';

import { revalidateTag } from 'next/cache';
import { serverTagsApi } from '@/lib/auth/server-api';
import type { TagWithOwnership } from '@/lib/typeDefinitions';

export async function getTags(): Promise<TagWithOwnership[]> {
  try {
    return await serverTagsApi.getAll();
  } catch (error) {
    console.error('Error fetching tags:', error);
    throw new Error('Не удалось загрузить теги');
  }
}

export async function createTag(formData: FormData) {
  const name = (formData.get('name') as string | null)?.trim();

  if (!name) {
    throw new Error('Укажите название тега');
  }

  try {
    await serverTagsApi.create({ name });
    revalidateTag('tags-list');
  } catch (error) {
    console.error('Error creating tag:', error);
    throw new Error('Не удалось создать тег');
  }
}

export async function updateTag(id: string, formData: FormData) {
  const name = (formData.get('name') as string | null)?.trim();

  if (!name) {
    throw new Error('Укажите название тега');
  }

  try {
    await serverTagsApi.update(id, { name });
    revalidateTag('tags-list');
    revalidateTag('habits-list');
  } catch (error) {
    console.error('Error updating tag:', error);
    throw new Error('Не удалось обновить тег');
  }
}

export async function deleteTag(id: string) {
  try {
    await serverTagsApi.delete(id);
    revalidateTag('tags-list');
    revalidateTag('habits-list');
  } catch (error) {
    console.error('Error deleting tag:', error);
    throw new Error('Не удалось удалить тег');
  }
}

export async function attachTagToHabit(tagId: string, habitId: string) {
  try {
    await serverTagsApi.attach(tagId, habitId);
    revalidateTag('habits-list');
    revalidateTag(`habit-${habitId}`);
  } catch (error) {
    console.error('Error attaching tag:', error);
    throw new Error('Не удалось привязать тег');
  }
}

export async function detachTagFromHabit(tagId: string, habitId: string) {
  try {
    await serverTagsApi.detach(tagId, habitId);
    revalidateTag('habits-list');
    revalidateTag(`habit-${habitId}`);
  } catch (error) {
    console.error('Error detaching tag:', error);
    throw new Error('Не удалось отвязать тег');
  }
}
