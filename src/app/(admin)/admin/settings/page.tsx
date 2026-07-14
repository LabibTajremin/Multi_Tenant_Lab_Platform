import { redirect } from 'next/navigation';
import { PostgresSiteSettingsRepository } from '@/infrastructure/repositories/PostgresSiteSettingsRepository';
import { getCurrentTenant } from '@/lib/tenantContext';
import { getSessionUser } from '@/lib/session';
import { canChangeSiteSettings } from '@/lib/rbac';
import SettingsForm from './SettingsForm';
import ReviewModeToggle from './ReviewModeToggle';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!canChangeSiteSettings(user)) {
    redirect('/admin/dashboard');
  }

  const tenant = await getCurrentTenant();
  const settings = await new PostgresSiteSettingsRepository().getByTenant(tenant.id);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-slate-100">Settings</h1>

      <div className="mt-6 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-md">
        <h2 className="font-medium text-slate-900 dark:text-slate-100">Review mode</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          When on, Editor-submitted content waits for Admin approval before it appears on the public site.
        </p>
        <div className="mt-4">
          <ReviewModeToggle enabled={tenant.reviewEnabled} />
        </div>
      </div>

      <div className="mt-8">
        <SettingsForm tenant={tenant} settings={settings} />
      </div>
    </div>
  );
}
