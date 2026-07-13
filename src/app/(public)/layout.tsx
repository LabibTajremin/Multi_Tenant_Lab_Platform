import { redirect } from 'next/navigation';
import { isTenantProvisioned } from '@/lib/setupStatus';

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
  return <>{children}</>;
}
