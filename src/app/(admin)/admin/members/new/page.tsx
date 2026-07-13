import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { canManageMembers } from '@/lib/rbac';
import MemberForm from '../MemberForm';
import { createMemberProfileAction } from '../actions';

export const dynamic = 'force-dynamic';

export default async function NewMemberPage() {
  const user = await getSessionUser();
  if (!canManageMembers(user)) {
    redirect('/admin/members');
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-slate-900">Add member</h1>
      <div className="mt-6">
        <MemberForm action={createMemberProfileAction} submitLabel="Add member" canEditStructuralFields />
      </div>
    </div>
  );
}
