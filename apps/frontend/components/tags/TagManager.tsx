'use client';

import { useState } from 'react';
import type { Tag } from '@/lib/typeDefinitions';
import { createTag, deleteTag, updateTag } from '@/app/actions/tagActions';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { TagList } from './TagList';

interface TagManagerProps {
  tags: Tag[];
}

export function TagManager({ tags }: TagManagerProps) {
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function handleCreate(formData: FormData) {
    setCreating(true);
    setError(null);

    try {
      await createTag(formData);
      setCreating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось создать тег');
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border p-4">
        <h2 className="text-lg font-semibold mb-3">Новый тег</h2>
        <form action={handleCreate} className="grid gap-3 md:grid-cols-[1fr_auto_auto] items-end">
          <div className="space-y-2">
            <Label htmlFor="tag-name">Название</Label>
            <Input id="tag-name" name="name" placeholder="Например: Здоровье" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tag-color">Цвет</Label>
            <input
              id="tag-color"
              name="color"
              type="color"
              defaultValue="#6366f1"
              className="h-9 w-16 rounded-md border border-border"
            />
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
          renderActions={(tag) => (
            <>
              <form
                action={updateTag.bind(null, tag.id)}
                className="flex flex-wrap items-center gap-2"
              >
                <Input name="name" defaultValue={tag.name} className="h-8 w-40" />
                <input
                  type="color"
                  name="color"
                  defaultValue={
                    /^#([0-9a-fA-F]{3}){1,2}$/.test(tag.color) ? tag.color : '#6366f1'
                  }
                  className="h-8 w-10 rounded-md border border-border"
                />
                <Button type="submit" size="sm" variant="outline">
                  Сохранить
                </Button>
              </form>
              <form action={deleteTag.bind(null, tag.id)}>
                <Button type="submit" size="sm" variant="destructive">
                  Удалить
                </Button>
              </form>
            </>
          )}
        />
      </div>
    </div>
  );
}
