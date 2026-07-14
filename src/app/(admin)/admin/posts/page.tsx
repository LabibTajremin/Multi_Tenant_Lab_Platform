import Link from 'next/link';
import { PostgresPostRepository } from '@/infrastructure/repositories/PostgresPostRepository';
import { getTenantId } from '@/lib/tenantContext';
import { getSessionUser } from '@/lib/session';
import { canDeleteContent, canEditContent } from '@/lib/rbac';
import StatusBadge from '@/components/admin/StatusBadge';
import { deletePostAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function PostsListPage() {
  const tenantId = getTenantId();
  const [user, posts] = await Promise.all([getSessionUser(), new PostgresPostRepository().listAll(tenantId)]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-slate-100">Funding &amp; Gallery</h1>
        <Link href="/admin/posts/new" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300">
          + Add post
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {posts.map((post) => (
              <tr key={post.id}>
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{post.title}</td>
                <td className="px-4 py-3 capitalize text-slate-700 dark:text-slate-300">{post.postType}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={post.status} />
                </td>
                <td className="px-4 py-3 text-right space-x-3">
                  {canEditContent(user, post) && (
                    <Link href={`/admin/posts/${post.id}/edit`} className="text-slate-700 dark:text-slate-300 hover:underline">
                      Edit
                    </Link>
                  )}
                  {canDeleteContent(user, post) && (
                    <form action={deletePostAction.bind(null, post.id)} className="inline">
                      <button type="submit" className="text-red-600 hover:underline">
                        Delete
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                  No posts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
