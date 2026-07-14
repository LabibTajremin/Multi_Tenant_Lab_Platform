import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { getCurrentTenant } from '@/lib/tenantContext';
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
    <div className="flex min-h-screen">
      <div className="w-64 shrink-0">
        <AdminNav actor={user} reviewEnabled={tenant.reviewEnabled} />
      </div>
      <div className="flex-1 bg-ivory-100 dark:bg-slate-800/50 px-8 py-8">{children}</div>
    </div>
  );
}
