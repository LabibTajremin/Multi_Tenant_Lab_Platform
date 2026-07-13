import { getCurrentTenant } from '@/lib/tenantContext';
import { PostgresPostRepository } from '@/infrastructure/repositories/PostgresPostRepository';

export default async function ResearchPage() {
  const tenant = await getCurrentTenant();
  const posts = await new PostgresPostRepository().listPublished(tenant.id, 'research');

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <h1 className="font-display text-3xl font-semibold text-slate-900">Research</h1>

      {posts.length === 0 ? (
        <p className="mt-6 max-w-prose text-slate-600">
          This lab hasn&apos;t published a research overview yet.
        </p>
      ) : (
        <div className="mt-8 space-y-12">
          {posts.map((post) => (
            <article key={post.id} className="max-w-prose">
              <h2 className="font-display text-2xl font-semibold text-slate-900">{post.title}</h2>
              {post.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.imageUrl} alt={post.imageAlt ?? ''} className="mt-4 aspect-video w-full rounded-lg object-cover" />
              )}
              {post.body && <p className="mt-4 whitespace-pre-line text-slate-700">{post.body}</p>}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
