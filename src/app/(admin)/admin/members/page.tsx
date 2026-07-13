import Link from 'next/link';
import { PostgresMemberRepository } from '@/infrastructure/repositories/PostgresMemberRepository';
import { listMembers } from '@/application/use-cases/members/ListMembers';
import { getTenantId } from '@/lib/tenantContext';
import { getSessionUser } from '@/lib/session';
import { canEditMemberProfile, canManageMembers } from '@/lib/rbac';
import { deleteMemberProfileAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function MembersListPage() {
  const tenantId = getTenantId();
  const repo = new PostgresMemberRepository();
  const [user, members] = await Promise.all([getSessionUser(), listMembers(tenantId, { repo })]);
  const canManage = canManageMembers(user);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-slate-900">People</h1>
        {canManage && (
          <Link href="/admin/members/new" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
            + Add member
          </Link>
        )}
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Position</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members.map((member) => (
              <tr key={member.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{member.fullName}</td>
                <td className="px-4 py-3 text-slate-700">{member.position}</td>
                <td className="px-4 py-3 text-right space-x-3">
                  {canEditMemberProfile(user, member) && (
                    <Link href={`/admin/members/${member.id}/edit`} className="text-slate-700 hover:underline">
                      Edit
                    </Link>
                  )}
                  {canManage && (
                    <form action={deleteMemberProfileAction.bind(null, member.id)} className="inline">
                      <button type="submit" className="text-red-600 hover:underline">
                        Delete
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {members.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                  No members yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
