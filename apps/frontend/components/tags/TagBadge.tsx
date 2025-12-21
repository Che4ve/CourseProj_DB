'use client';

import { Badge } from '@/components/ui/Badge';
import type { Tag } from '@/lib/typeDefinitions';

interface TagBadgeProps {
  tag: Tag;
}

export function TagBadge({ tag }: TagBadgeProps) {
  return (
    <Badge variant="secondary">{tag.name}</Badge>
  );
}
