'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { TagWithOwnership } from '@/lib/typeDefinitions';
import { createTag, deleteTag, updateTag } from '@/app/actions/tagActions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { TagList } from './TagList';

interface TagManagerProps {
  tags: TagWithOwnership[];
}

export function TagManager({ tags }: TagManagerProps) {
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  async function handleCreate(formData: FormData) {
    setCreating(true);
    setError(null);

    try {
      await createTag(formData);
      router.refresh();
      setCreating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось создать тег');
      setCreating(false);
    }
  }

  async function handleUpdate(id: string, formData: FormData) {
    setError(null);
    try {
      await updateTag(id, formData);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось обновить тег');
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      await deleteTag(id);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось удалить тег');
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border p-4">
        <h2 className="text-lg font-semibold mb-3">Новый тег</h2>
        <form action={handleCreate} className="grid gap-3 md:grid-cols-[1fr_auto] items-end">
          <div className="space-y-2">
            <Label htmlFor="tag-name">Название</Label>
            <Input id="tag-name" name="name" placeholder="Например: Здоровье" required />
          </div>
          <Button type="submit" disabled={creating}>
            {creating ? 'Создание...' : 'Создать'}
          </Button>
        </form>
        {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Все теги</h2>
        <TagList
          tags={tags}
          renderActions={(tag) =>
            tag.isOwned ? (
              <>
                <form
                  action={handleUpdate.bind(null, tag.id)}
                  className="flex flex-wrap items-center gap-2"
                >
                  <Input name="name" defaultValue={tag.name} className="h-8 w-40" />
                  <Button type="submit" size="sm" variant="outline">
                    Сохранить
                  </Button>
                </form>
                <form action={handleDelete.bind(null, tag.id)}>
                  <Button
                    type="submit"
                    size="sm"
                    variant="outline"
                    className="h-8 px-3 text-sm text-rose-600 border-rose-200/70 hover:bg-rose-50 hover:text-rose-700"
                  >
                    Удалить
                  </Button>
                </form>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">Только чтение</span>
            )
          }
        />
      </div>
    </div>
  );
}
