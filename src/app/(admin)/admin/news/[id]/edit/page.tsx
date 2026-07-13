import { notFound, redirect } from 'next/navigation';
import { PostgresNewsRepository } from '@/infrastructure/repositories/PostgresNewsRepository';
import { getTenantId } from '@/lib/tenantContext';
import { getSessionUser } from '@/lib/session';
import { canEditContent } from '@/lib/rbac';
import NewsForm from '../../NewsForm';
import { updateNewsItemAction } from '../../actions';

export const dynamic = 'force-dynamic';

export default async function EditNewsItemPage({ params }: { params: { id: string } }) {
  const tenantId = getTenantId();
  const [user, newsItem] = await Promise.all([
    getSessionUser(),
    new PostgresNewsRepository().findById(tenantId, params.id),
  ]);

  if (!newsItem) {
    notFound();
  }
  if (!canEditContent(user, newsItem)) {
    redirect('/admin/news');
  }

  const boundAction = updateNewsItemAction.bind(null, newsItem.id);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-slate-900">Edit news item</h1>
      <div className="mt-6">
        <NewsForm action={boundAction} newsItem={newsItem} submitLabel="Save changes" />
      </div>
    </div>
  );
}
