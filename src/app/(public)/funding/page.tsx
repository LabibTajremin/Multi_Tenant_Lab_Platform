import { getCurrentTenant } from '@/lib/tenantContext';
import { PostgresPostRepository } from '@/infrastructure/repositories/PostgresPostRepository';

export default async function FundingPage() {
  const tenant = await getCurrentTenant();
  const posts = await new PostgresPostRepository().listPublished(tenant.id, 'funding');

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <h1 className="font-display text-3xl font-semibold text-slate-900">Funding</h1>
      <p className="mt-2 max-w-prose text-slate-600">We gratefully acknowledge support from the following sources.</p>

      <ul className="mt-8 grid gap-6 sm:grid-cols-2">
        {posts.map((post) => (
          <li key={post.id} className="rounded-lg border border-slate-200 p-5">
            {post.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.imageUrl} alt={post.imageAlt ?? ''} className="mb-4 h-16 object-contain" />
            )}
            <p className="font-medium text-slate-900">{post.title}</p>
            {post.body && <p className="mt-2 text-sm text-slate-600">{post.body}</p>}
          </li>
        ))}
        {posts.length === 0 && <p className="text-slate-500">No funding acknowledgements yet.</p>}
      </ul>
    </main>
  );
}
