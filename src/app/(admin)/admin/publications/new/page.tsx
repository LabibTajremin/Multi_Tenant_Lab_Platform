import { getSessionUser } from '@/lib/session';
import { canFeatureContent } from '@/lib/rbac';
import PublicationForm from '../PublicationForm';
import { createPublicationAction } from '../actions';

export const dynamic = 'force-dynamic';

export default async function NewPublicationPage() {
  const user = await getSessionUser();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-slate-900">Add publication</h1>
      <div className="mt-6">
        <PublicationForm
          action={createPublicationAction}
          submitLabel="Add publication"
          canFeature={canFeatureContent(user)}
        />
      </div>
    </div>
  );
}
