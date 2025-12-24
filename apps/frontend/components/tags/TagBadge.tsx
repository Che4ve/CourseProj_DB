'use client';

import { Badge } from '@/components/ui/Badge';
import type { Tag } from '@/lib/typeDefinitions';
import { Tag as TagIcon } from 'lucide-react';

interface TagBadgeProps {
  tag: Tag;
}

export function TagBadge({ tag }: TagBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className="gap-1.5 rounded-full border border-border/60 bg-secondary/60 px-3 py-1 text-sm font-medium text-foreground"
    >
      <TagIcon className="h-3.5 w-3.5 text-muted-foreground" />
      {tag.name}
    </Badge>
  );
}
