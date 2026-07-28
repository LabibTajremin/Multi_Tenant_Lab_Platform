import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { getCurrentTenant } from '@/lib/tenantContext';
import { backgroundPatternClass } from '@/lib/backgroundPattern';
import AdminNav from '@/components/admin/AdminNav';

// Reads live session + per-deployment DB state — never statically prerendered.
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }
  if (user.mustResetPassword) {
    redirect('/reset-password');
  }

  const tenant = await getCurrentTenant();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <AdminNav actor={user} reviewEnabled={tenant.reviewEnabled} />
      <div
        className={`bg-surface ${backgroundPatternClass(tenant.backgroundPattern)} min-w-0 flex-1 px-4 py-6 sm:px-6 md:px-8 md:py-8`}
      >
        {children}
      </div>
    </div>
  );
}
