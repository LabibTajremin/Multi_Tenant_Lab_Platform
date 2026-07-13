import { notFound, redirect } from 'next/navigation';
import { PostgresMemberRepository } from '@/infrastructure/repositories/PostgresMemberRepository';
import { getTenantId } from '@/lib/tenantContext';
import { getSessionUser } from '@/lib/session';
import { canEditMemberProfile, canManageMembers } from '@/lib/rbac';
import MemberForm from '../../MemberForm';
import { updateMemberProfileAction } from '../../actions';

export const dynamic = 'force-dynamic';

export default async function EditMemberPage({ params }: { params: { id: string } }) {
  const tenantId = getTenantId();
  const [user, member] = await Promise.all([
    getSessionUser(),
    new PostgresMemberRepository().findById(tenantId, params.id),
  ]);

  if (!member) {
    notFound();
  }
  if (!canEditMemberProfile(user, member)) {
    redirect('/admin/members');
  }

  const boundAction = updateMemberProfileAction.bind(null, member.id);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-slate-900">Edit member</h1>
      <div className="mt-6">
        <MemberForm
          action={boundAction}
          member={member}
          submitLabel="Save changes"
          canEditStructuralFields={canManageMembers(user)}
        />
      </div>
    </div>
  );
}
