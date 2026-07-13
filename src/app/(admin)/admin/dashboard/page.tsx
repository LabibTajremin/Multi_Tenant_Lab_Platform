import Link from 'next/link';
import { PostgresPublicationRepository } from '@/infrastructure/repositories/PostgresPublicationRepository';
import { PostgresMemberRepository } from '@/infrastructure/repositories/PostgresMemberRepository';
import { PostgresNewsRepository } from '@/infrastructure/repositories/PostgresNewsRepository';
import { PostgresPostRepository } from '@/infrastructure/repositories/PostgresPostRepository';
import { getTenantId } from '@/lib/tenantContext';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const tenantId = getTenantId();
  const [publications, members, news, posts] = await Promise.all([
    new PostgresPublicationRepository().listAll(tenantId),
    new PostgresMemberRepository().listByTenant(tenantId),
    new PostgresNewsRepository().listAll(tenantId),
    new PostgresPostRepository().listAll(tenantId),
  ]);

  const pendingCount =
    publications.filter((p) => p.status === 'pending_review').length +
    news.filter((n) => n.status === 'pending_review').length +
    posts.filter((p) => p.status === 'pending_review').length;

  const stats = [
    { label: 'Publications', count: publications.length, href: '/admin/publications' },
    { label: 'People', count: members.length, href: '/admin/members' },
    { label: 'News items', count: news.length, href: '/admin/news' },
    { label: 'Funding & gallery posts', count: posts.length, href: '/admin/posts' },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-slate-900">Dashboard</h1>

      {pendingCount > 0 && (
        <Link
          href="/admin/review-queue"
          className="mt-4 block rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 transition hover:bg-amber-100"
        >
          {pendingCount} item{pendingCount === 1 ? '' : 's'} waiting for review →
        </Link>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.href}
            href={stat.href}
            className="rounded-lg border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm"
          >
            <p className="text-3xl font-semibold text-slate-900">{stat.count}</p>
            <p className="mt-1 text-sm text-slate-600">{stat.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/admin/publications/new" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
          + Add publication
        </Link>
        <Link href="/admin/news/new" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
          + Add news item
        </Link>
        <Link href="/admin/members/new" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
          + Add member
        </Link>
      </div>
    </div>
  );
}
