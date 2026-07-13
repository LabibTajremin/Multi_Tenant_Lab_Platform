import Link from 'next/link';
import { getCurrentTenant } from '@/lib/tenantContext';
import { resolveAccent, accentClasses } from '@/lib/accent';
import { PostgresSiteSettingsRepository } from '@/infrastructure/repositories/PostgresSiteSettingsRepository';
import { PostgresNewsRepository } from '@/infrastructure/repositories/PostgresNewsRepository';
import { PostgresPublicationRepository } from '@/infrastructure/repositories/PostgresPublicationRepository';
import { PostgresPostRepository } from '@/infrastructure/repositories/PostgresPostRepository';
import { listMembers } from '@/application/use-cases/members/ListMembers';
import { PostgresMemberRepository } from '@/infrastructure/repositories/PostgresMemberRepository';

export default async function HomePage() {
  const tenant = await getCurrentTenant();
  const accent = accentClasses(resolveAccent(tenant.primaryColor));

  const [settings, news, publications, researchPosts, members] = await Promise.all([
    new PostgresSiteSettingsRepository().getByTenant(tenant.id),
    new PostgresNewsRepository().listPublished(tenant.id),
    new PostgresPublicationRepository().listPublished(tenant.id, { sort: 'year_desc' }),
    new PostgresPostRepository().listPublished(tenant.id, 'research'),
    listMembers(tenant.id, { repo: new PostgresMemberRepository() }),
  ]);

  const latestNews = news.slice(0, 3);
  const latestPublications = publications.slice(0, 3);
  const peopleTeaser = members.slice(0, 4);
  const researchHighlight = researchPosts[0];

  return (
    <main>
      <section
        className={`${settings?.bannerUrl ? '' : accent.bg50} relative overflow-hidden`}
        style={settings?.bannerUrl ? { backgroundImage: `url(${settings.bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
      >
        {settings?.bannerUrl && <div className="absolute inset-0 bg-slate-900/50" />}
        <div className="relative mx-auto max-w-content px-6 py-28 text-center">
          <h1
            className={`font-display text-4xl font-semibold sm:text-5xl ${settings?.bannerUrl ? 'text-white' : 'text-slate-900'}`}
          >
            {tenant.labName}
          </h1>
          {tenant.university && (
            <p className={`mt-2 text-lg ${settings?.bannerUrl ? 'text-slate-100' : 'text-slate-600'}`}>{tenant.university}</p>
          )}
          {settings?.tagline && (
            <p className={`mx-auto mt-4 max-w-2xl text-lg ${settings?.bannerUrl ? 'text-slate-100' : 'text-slate-700'}`}>
              {settings.tagline}
            </p>
          )}
        </div>
      </section>

      {researchHighlight && (
        <section className="mx-auto max-w-content px-6 py-16">
          <h2 className="font-display text-2xl font-semibold text-slate-900">{researchHighlight.title}</h2>
          {researchHighlight.body && <p className="mt-4 max-w-prose text-slate-700">{researchHighlight.body}</p>}
          <Link href="/research" className={`mt-4 inline-block text-sm font-medium ${accent.text600} hover:underline`}>
            More about our research →
          </Link>
        </section>
      )}

      <section className="mx-auto max-w-content px-6 py-16">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-semibold text-slate-900">Latest news</h2>
          <Link href="/news" className={`text-sm font-medium ${accent.text600} hover:underline`}>
            View all →
          </Link>
        </div>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {latestNews.map((item) => (
            <article key={item.id} className="rounded-lg border border-slate-200 p-5 transition hover:shadow-sm">
              <p className="text-xs text-slate-500">{new Date(item.publishedDate).toLocaleDateString()}</p>
              <h3 className="mt-1 font-medium text-slate-900">{item.title}</h3>
              <p className="mt-2 line-clamp-3 text-sm text-slate-600">{item.body}</p>
            </article>
          ))}
          {latestNews.length === 0 && <p className="text-slate-500">No news yet — check back soon.</p>}
        </div>
      </section>

      <section className={`${accent.bg50} py-16`}>
        <div className="mx-auto max-w-content px-6">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-semibold text-slate-900">Recent publications</h2>
            <Link href="/publications" className={`text-sm font-medium ${accent.text600} hover:underline`}>
              View all →
            </Link>
          </div>
          <ul className="mt-6 space-y-4">
            {latestPublications.map((pub) => (
              <li key={pub.id} className="rounded-lg bg-white p-5 shadow-sm">
                <p className="font-medium text-slate-900">{pub.title}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {pub.authors} — {pub.venue ? `${pub.venue}, ` : ''}
                  {pub.year}
                </p>
              </li>
            ))}
            {latestPublications.length === 0 && <p className="text-slate-500">No publications listed yet.</p>}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-content px-6 py-16">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-semibold text-slate-900">Our people</h2>
          <Link href="/people" className={`text-sm font-medium ${accent.text600} hover:underline`}>
            Meet the team →
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {peopleTeaser.map((member) => (
            <div key={member.id} className="text-center">
              <div className={`mx-auto h-20 w-20 overflow-hidden rounded-full ${accent.bg100}`}>
                {member.photoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={member.photoUrl} alt={member.photoAlt ?? member.fullName} className="h-full w-full object-cover" />
                )}
              </div>
              <p className="mt-2 text-sm font-medium text-slate-900">{member.fullName}</p>
              <p className="text-xs text-slate-500">{member.position}</p>
            </div>
          ))}
          {peopleTeaser.length === 0 && <p className="text-slate-500">No team members listed yet.</p>}
        </div>
      </section>
    </main>
  );
}
