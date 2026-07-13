import { getSessionUser } from '@/lib/session';
import { canFeatureContent } from '@/lib/rbac';
import NewsForm from '../NewsForm';
import { createNewsItemAction } from '../actions';

export const dynamic = 'force-dynamic';

export default async function NewNewsItemPage() {
  const user = await getSessionUser();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-slate-900">Add news item</h1>
      <div className="mt-6">
        <NewsForm action={createNewsItemAction} submitLabel="Add news item" canFeature={canFeatureContent(user)} />
      </div>
    </div>
  );
}
