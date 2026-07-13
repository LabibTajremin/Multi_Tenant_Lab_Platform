import { getCurrentTenant } from '@/lib/tenantContext';
import { PostgresNewsRepository } from '@/infrastructure/repositories/PostgresNewsRepository';
import { resolveAccent, accentClasses } from '@/lib/accent';

export default async function NewsPage() {
  const tenant = await getCurrentTenant();
  const accent = accentClasses(resolveAccent(tenant.primaryColor));
  const items = await new PostgresNewsRepository().listPublished(tenant.id);

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <h1 className="font-display text-3xl font-semibold text-slate-900">News</h1>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <article key={item.id} className="overflow-hidden rounded-lg border border-slate-200">
            {item.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.imageUrl} alt={item.imageAlt ?? ''} className="aspect-video w-full object-cover" />
            )}
            <div className="p-5">
              <p className="text-xs text-slate-500">{new Date(item.publishedDate).toLocaleDateString()}</p>
              <h2 className="mt-1 font-medium text-slate-900">{item.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{item.body}</p>
              {item.linkUrl && (
                <a href={item.linkUrl} target="_blank" rel="noreferrer" className={`mt-3 inline-block text-sm font-medium ${accent.text600} hover:underline`}>
                  Read more →
                </a>
              )}
            </div>
          </article>
        ))}
        {items.length === 0 && <p className="text-slate-500">No news yet — check back soon.</p>}
      </div>
    </main>
  );
}
