import PublicationForm from '../PublicationForm';
import { createPublicationAction } from '../actions';

export const dynamic = 'force-dynamic';

export default function NewPublicationPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-slate-900">Add publication</h1>
      <div className="mt-6">
        <PublicationForm action={createPublicationAction} submitLabel="Add publication" />
      </div>
    </div>
  );
}
