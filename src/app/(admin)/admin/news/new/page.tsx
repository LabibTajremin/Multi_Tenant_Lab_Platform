import NewsForm from '../NewsForm';
import { createNewsItemAction } from '../actions';

export const dynamic = 'force-dynamic';

export default function NewNewsItemPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-slate-900">Add news item</h1>
      <div className="mt-6">
        <NewsForm action={createNewsItemAction} submitLabel="Add news item" />
      </div>
    </div>
  );
}
