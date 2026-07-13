import { redirect } from 'next/navigation';
import { PostgresUserRepository } from '@/infrastructure/repositories/PostgresUserRepository';
import { getTenantId } from '@/lib/tenantContext';
import { getSessionUser } from '@/lib/session';
import { canManageUsers } from '@/lib/rbac';
import CreateEditorForm from './CreateEditorForm';
import ResetPasswordButton from './ResetPasswordButton';
import { toggleUserActiveAction } from './actions';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const user = await getSessionUser();
  if (!canManageUsers(user)) {
    redirect('/admin/dashboard');
  }

  const tenantId = getTenantId();
  const users = await new PostgresUserRepository().listByTenant(tenantId);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-slate-900">Users</h1>

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{u.displayName}</td>
                <td className="px-4 py-3 text-slate-700">{u.email}</td>
                <td className="px-4 py-3 capitalize text-slate-700">{u.role}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      u.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {u.isActive ? 'Active' : 'Deactivated'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <ResetPasswordButton userId={u.id} />
                    {u.id !== user?.id && (
                      <form action={toggleUserActiveAction.bind(null, u.id, !u.isActive)}>
                        <button type="submit" className="text-slate-700 hover:underline">
                          {u.isActive ? 'Deactivate' : 'Reactivate'}
                        </button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mt-10 font-display text-xl font-semibold text-slate-900">Add an Editor</h2>
      <div className="mt-4">
        <CreateEditorForm />
      </div>
    </div>
  );
}
