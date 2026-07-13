import Link from 'next/link';
import { PostgresPublicationRepository } from '@/infrastructure/repositories/PostgresPublicationRepository';
import { getTenantId } from '@/lib/tenantContext';
import { getSessionUser } from '@/lib/session';
import { canDeleteContent, canEditContent } from '@/lib/rbac';
import StatusBadge from '@/components/admin/StatusBadge';
import { deletePublicationAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function PublicationsListPage() {
  const [tenantId, user] = [getTenantId(), await getSessionUser()];
  const publications = await new PostgresPublicationRepository().listAll(tenantId);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-slate-900">Publications</h1>
        <Link href="/admin/publications/new" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
          + Add publication
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Year</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {publications.map((pub) => (
              <tr key={pub.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{pub.title}</p>
                  <p className="text-slate-500">{pub.authors}</p>
                </td>
                <td className="px-4 py-3 text-slate-700">{pub.year}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={pub.status} />
                    {pub.isFeatured && (
                      <span className="inline-block rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
                        ★ Featured
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-right space-x-3">
                  {canEditContent(user, pub) && (
                    <Link href={`/admin/publications/${pub.id}/edit`} className="text-slate-700 hover:underline">
                      Edit
                    </Link>
                  )}
                  {canDeleteContent(user, pub) && (
                    <form action={deletePublicationAction.bind(null, pub.id)} className="inline">
                      <button type="submit" className="text-red-600 hover:underline">
                        Delete
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {publications.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                  No publications yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
