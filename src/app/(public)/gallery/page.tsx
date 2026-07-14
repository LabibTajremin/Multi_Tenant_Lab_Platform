import { getCurrentTenant } from '@/lib/tenantContext';
import { PostgresPostRepository } from '@/infrastructure/repositories/PostgresPostRepository';

export default async function GalleryPage() {
  const tenant = await getCurrentTenant();
  const posts = await new PostgresPostRepository().listPublished(tenant.id, 'gallery');

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <h1 className="font-display text-3xl font-semibold text-slate-900 dark:text-slate-100">Gallery</h1>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {posts.map((post) =>
          post.imageUrl ? (
            <figure
              key={post.id}
              className="group overflow-hidden rounded-lg shadow-sm transition-shadow duration-200 ease-out hover:shadow-xl dark:hover:shadow-2xl dark:hover:shadow-black/40"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.imageUrl}
                alt={post.imageAlt ?? post.title}
                className="aspect-square w-full object-cover transition duration-200 group-hover:scale-105"
              />
              <figcaption className="mt-2 text-sm text-slate-600 dark:text-slate-400">{post.title}</figcaption>
            </figure>
          ) : null,
        )}
        {posts.length === 0 && <p className="text-slate-500 dark:text-slate-400">No gallery images yet.</p>}
      </div>
    </main>
  );
}
