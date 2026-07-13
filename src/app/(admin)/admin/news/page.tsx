import Link from 'next/link';
import { PostgresNewsRepository } from '@/infrastructure/repositories/PostgresNewsRepository';
import { getTenantId } from '@/lib/tenantContext';
import { getSessionUser } from '@/lib/session';
import { canDeleteContent, canEditContent } from '@/lib/rbac';
import StatusBadge from '@/components/admin/StatusBadge';
import { deleteNewsItemAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function NewsListPage() {
  const tenantId = getTenantId();
  const [user, items] = await Promise.all([getSessionUser(), new PostgresNewsRepository().listAll(tenantId)]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-slate-100">News</h1>
        <Link href="/admin/news/new" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300">
          + Add news item
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{item.title}</td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{new Date(item.publishedDate).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={item.status} />
                    {item.isFeatured && (
                      <span className="inline-block rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
                        ★ Featured
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right space-x-3">
                  {canEditContent(user, item) && (
                    <Link href={`/admin/news/${item.id}/edit`} className="text-slate-700 dark:text-slate-300 hover:underline">
                      Edit
                    </Link>
                  )}
                  {canDeleteContent(user, item) && (
                    <form action={deleteNewsItemAction.bind(null, item.id)} className="inline">
                      <button type="submit" className="text-red-600 hover:underline">
                        Delete
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                  No news items yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
