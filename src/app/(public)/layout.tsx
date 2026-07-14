import { redirect } from 'next/navigation';
import { isTenantProvisioned } from '@/lib/setupStatus';
import { getCurrentTenant } from '@/lib/tenantContext';
import { getSessionUser } from '@/lib/session';
import { PostgresSiteSettingsRepository } from '@/infrastructure/repositories/PostgresSiteSettingsRepository';
import SiteHeader from '@/components/public/SiteHeader';
import SiteFooter from '@/components/public/SiteFooter';

// Every page here reads live, per-deployment DB state (tenant settings, content),
// so it can never be statically prerendered at build time — this build produces
// one artifact reused by every tenant deployment (Section 2), and none of them
// share build-time env/DB access.
export const dynamic = 'force-dynamic';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const provisioned = await isTenantProvisioned();
  if (!provisioned) {
    redirect('/setup');
  }

  const tenant = await getCurrentTenant();
  const [settings, sessionUser] = await Promise.all([
    new PostgresSiteSettingsRepository().getByTenant(tenant.id),
    getSessionUser(),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader tenant={tenant} isLoggedIn={Boolean(sessionUser)} />
      <div className="flex-1">{children}</div>
      <SiteFooter tenant={tenant} settings={settings} />
    </div>
  );
}
