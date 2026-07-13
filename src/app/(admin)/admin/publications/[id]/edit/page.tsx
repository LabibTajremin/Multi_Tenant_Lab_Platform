import { notFound, redirect } from 'next/navigation';
import { PostgresPublicationRepository } from '@/infrastructure/repositories/PostgresPublicationRepository';
import { getTenantId } from '@/lib/tenantContext';
import { getSessionUser } from '@/lib/session';
import { canEditContent, canFeatureContent } from '@/lib/rbac';
import PublicationForm from '../../PublicationForm';
import { updatePublicationAction } from '../../actions';

export const dynamic = 'force-dynamic';

export default async function EditPublicationPage({ params }: { params: { id: string } }) {
  const tenantId = getTenantId();
  const [user, publication] = await Promise.all([
    getSessionUser(),
    new PostgresPublicationRepository().findById(tenantId, params.id),
  ]);

  if (!publication) {
    notFound();
  }
  if (!canEditContent(user, publication)) {
    redirect('/admin/publications');
  }

  const boundAction = updatePublicationAction.bind(null, publication.id);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-slate-900">Edit publication</h1>
      <div className="mt-6">
        <PublicationForm
          action={boundAction}
          publication={publication}
          submitLabel="Save changes"
          canFeature={canFeatureContent(user)}
        />
      </div>
    </div>
  );
}
