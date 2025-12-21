'use client';

import type { Tag } from '@/lib/typeDefinitions';

interface TagSelectorProps {
  tags: Tag[];
  selectedTagIds?: string[];
  name?: string;
  disabled?: boolean;
}

export function TagSelector({
  tags,
  selectedTagIds = [],
  name = 'tagIds',
  disabled = false,
}: TagSelectorProps) {
  if (tags.length === 0) {
    return <p className="text-sm text-muted-foreground">Теги пока не созданы</p>;
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 max-h-48 overflow-y-auto pr-1">
      {tags.map((tag) => {
        const isChecked = selectedTagIds.includes(tag.id);
        return (
          <label
            key={tag.id}
            className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm"
          >
            <input
              type="checkbox"
              name={name}
              value={tag.id}
              defaultChecked={isChecked}
              disabled={disabled}
              className="h-4 w-4"
            />
            <span>{tag.name}</span>
          </label>
        );
      })}
    </div>
  );
}
