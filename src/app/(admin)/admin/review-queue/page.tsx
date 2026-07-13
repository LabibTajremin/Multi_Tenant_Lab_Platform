import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PostgresPublicationRepository } from '@/infrastructure/repositories/PostgresPublicationRepository';
import { PostgresNewsRepository } from '@/infrastructure/repositories/PostgresNewsRepository';
import { PostgresPostRepository } from '@/infrastructure/repositories/PostgresPostRepository';
import { getTenantId, getCurrentTenant } from '@/lib/tenantContext';
import { getSessionUser } from '@/lib/session';
import { canApproveContent } from '@/lib/rbac';
import { approveItemAction, rejectItemAction, type ContentKind } from './actions';

export const dynamic = 'force-dynamic';

interface QueueRow {
  kind: ContentKind;
  id: string;
  title: string;
  createdAt: Date;
}

export default async function ReviewQueuePage() {
  const [user, tenant] = await Promise.all([getSessionUser(), getCurrentTenant()]);
  if (!canApproveContent(user)) {
    redirect('/admin/dashboard');
  }
  if (!tenant.reviewEnabled) {
    redirect('/admin/dashboard');
  }

  const tenantId = getTenantId();
  const [publications, news, posts] = await Promise.all([
    new PostgresPublicationRepository().listPending(tenantId),
    new PostgresNewsRepository().listPending(tenantId),
    new PostgresPostRepository().listPending(tenantId),
  ]);

  const rows: QueueRow[] = [
    ...publications.map((p) => ({ kind: 'publication' as const, id: p.id, title: p.title, createdAt: p.createdAt })),
    ...news.map((n) => ({ kind: 'news' as const, id: n.id, title: n.title, createdAt: n.createdAt })),
    ...posts.map((p) => ({ kind: 'post' as const, id: p.id, title: p.title, createdAt: p.createdAt })),
  ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const KIND_LABEL: Record<ContentKind, string> = { publication: 'Publication', news: 'News', post: 'Post' };
  const EDIT_HREF: Record<ContentKind, (id: string) => string> = {
    publication: (id) => `/admin/publications/${id}/edit`,
    news: (id) => `/admin/news/${id}/edit`,
    post: (id) => `/admin/posts/${id}/edit`,
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-slate-100">Review queue</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        Editor submissions wait here until an Admin approves or rejects them (Section 7 review mode is on).
      </p>

      <div className="mt-6 space-y-4">
        {rows.map((row) => (
          <div key={`${row.kind}-${row.id}`} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="inline-block rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                  {KIND_LABEL[row.kind]}
                </span>
                <p className="mt-1 font-medium text-slate-900 dark:text-slate-100">{row.title}</p>
              </div>
              <div className="flex items-center gap-3">
                <Link href={EDIT_HREF[row.kind](row.id)} className="text-sm text-slate-700 dark:text-slate-300 hover:underline">
                  Edit
                </Link>
                <form action={approveItemAction.bind(null, row.kind, row.id)}>
                  <button type="submit" className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700">
                    Approve
                  </button>
                </form>
              </div>
            </div>
            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-red-600">Reject with a note…</summary>
              <form action={rejectItemAction.bind(null, row.kind, row.id)} className="mt-2 flex gap-2">
                <input
                  name="note"
                  required
                  placeholder="Why is this being rejected?"
                  className="flex-1 rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 dark:bg-slate-800 dark:text-slate-100"
                />
                <button type="submit" className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700">
                  Reject
                </button>
              </form>
            </details>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 px-4 py-8 text-center text-slate-500 dark:text-slate-400">
            Nothing waiting for review.
          </p>
        )}
      </div>
    </div>
  );
}
