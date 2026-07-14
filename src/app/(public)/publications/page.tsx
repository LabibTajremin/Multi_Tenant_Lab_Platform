import { getCurrentTenant } from '@/lib/tenantContext';
import { PostgresPublicationRepository } from '@/infrastructure/repositories/PostgresPublicationRepository';
import { resolveAccent, accentClasses } from '@/lib/accent';

export default async function PublicationsPage({
  searchParams,
}: {
  searchParams: { q?: string; year?: string; sort?: string };
}) {
  const tenant = await getCurrentTenant();
  const accent = accentClasses(resolveAccent(tenant.primaryColor));
  const sort = searchParams.sort === 'year_asc' ? 'year_asc' : 'year_desc';
  const year = searchParams.year ? Number(searchParams.year) : undefined;

  const publications = await new PostgresPublicationRepository().listPublished(tenant.id, {
    search: searchParams.q || undefined,
    year: Number.isFinite(year) ? year : undefined,
    sort,
  });

  const years = Array.from(new Set(publications.map((p) => p.year))).sort((a, b) => b - a);

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <h1 className="font-display text-3xl font-semibold text-slate-900 dark:text-slate-100">Publications</h1>

      <form method="get" className="mt-8 flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="q" className="block text-xs font-medium text-slate-600 dark:text-slate-400">
            Search by title or author
          </label>
          <input
            id="q"
            name="q"
            defaultValue={searchParams.q ?? ''}
            className="mt-1 w-64 rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <div>
          <label htmlFor="year" className="block text-xs font-medium text-slate-600 dark:text-slate-400">
            Year
          </label>
          <select
            id="year"
            name="year"
            defaultValue={searchParams.year ?? ''}
            className="mt-1 rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">All years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="sort" className="block text-xs font-medium text-slate-600 dark:text-slate-400">
            Sort
          </label>
          <select
            id="sort"
            name="sort"
            defaultValue={sort}
            className="mt-1 rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="year_desc">Newest first</option>
            <option value="year_asc">Oldest first</option>
          </select>
        </div>
        <button type="submit" className={`rounded-md ${accent.bg600} px-4 py-2 text-sm font-medium text-white`}>
          Apply
        </button>
      </form>

      <ul className="mt-8 divide-y divide-slate-200 dark:divide-slate-700">
        {publications.map((pub) => (
          <li
            key={pub.id}
            className="-mx-4 rounded-lg px-4 py-5 transition-colors duration-200 ease-out hover:bg-slate-50 dark:hover:bg-slate-800/60"
          >
            <p className="font-medium text-slate-900 dark:text-slate-100">{pub.title}</p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {pub.authors} — {pub.venue ? `${pub.venue}, ` : ''}
              {pub.year}
            </p>
            <div className="mt-2 flex gap-4 text-sm">
              {pub.doiOrLink && (
                <a href={pub.doiOrLink} target="_blank" rel="noreferrer" className={`${accent.text600} hover:underline`}>
                  DOI / link
                </a>
              )}
              {pub.pdfUrl && (
                <a href={pub.pdfUrl} target="_blank" rel="noreferrer" className={`${accent.text600} hover:underline`}>
                  PDF
                </a>
              )}
            </div>
          </li>
        ))}
        {publications.length === 0 && <p className="py-8 text-center text-slate-500 dark:text-slate-400">No publications match.</p>}
      </ul>
    </main>
  );
}
