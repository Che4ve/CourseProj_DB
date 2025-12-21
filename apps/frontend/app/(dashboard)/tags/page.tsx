import { TagManager } from '@/components/tags/TagManager';
import { getTags } from '@/app/actions/tagActions';

export default async function TagsPage() {
  const tags = await getTags();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Теги</h1>
        <p className="text-sm text-muted-foreground">
          Управляйте тегами и группируйте привычки для удобной фильтрации.
        </p>
      </div>
      <TagManager tags={tags} />
    </div>
  );
}
