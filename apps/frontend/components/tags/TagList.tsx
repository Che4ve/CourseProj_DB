'use client';

import { useMemo, useState } from 'react';
import type { Tag } from '@/lib/typeDefinitions';
import { Input } from '@/components/ui/Input';
import { TagBadge } from './TagBadge';

interface TagListProps {
  tags: Tag[];
  renderActions?: (tag: Tag) => React.ReactNode;
}

export function TagList({ tags, renderActions }: TagListProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return tags;
    return tags.filter((tag) => tag.name.toLowerCase().includes(normalized));
  }, [query, tags]);

  return (
    <div className="space-y-4">
      <Input
        type="text"
        placeholder="Поиск тегов"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Теги не найдены</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((tag) => (
            <div
              key={tag.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <TagBadge tag={tag} />
                <span className="text-xs text-muted-foreground">Использований: {tag.usageCount}</span>
              </div>
              {renderActions ? (
                <div className="flex flex-wrap items-center gap-2">{renderActions(tag)}</div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
