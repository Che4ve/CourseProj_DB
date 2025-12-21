'use client';

import { Badge } from '@/components/ui/Badge';
import type { Tag } from '@/lib/typeDefinitions';

interface TagBadgeProps {
  tag: Tag;
}

export function TagBadge({ tag }: TagBadgeProps) {
  const isHexColor = /^#([0-9a-fA-F]{3}){1,2}$/.test(tag.color);
  const style = isHexColor
    ? { backgroundColor: tag.color, borderColor: tag.color, color: '#fff' }
    : undefined;

  return (
    <Badge variant={isHexColor ? 'default' : 'secondary'} style={style}>
      {tag.name}
    </Badge>
  );
}
