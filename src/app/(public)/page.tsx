import Link from 'next/link';
import { getCurrentTenant } from '@/lib/tenantContext';
import { resolveAccent, accentClasses } from '@/lib/accent';
import { buildCarouselItems } from '@/lib/homeCarousel';
import { PostgresSiteSettingsRepository } from '@/infrastructure/repositories/PostgresSiteSettingsRepository';
import { PostgresNewsRepository } from '@/infrastructure/repositories/PostgresNewsRepository';
import { PostgresPublicationRepository } from '@/infrastructure/repositories/PostgresPublicationRepository';
import { PostgresPostRepository } from '@/infrastructure/repositories/PostgresPostRepository';
import { listMembers } from '@/application/use-cases/members/ListMembers';
import { PostgresMemberRepository } from '@/infrastructure/repositories/PostgresMemberRepository';
import { MEMBER_POSITION_LABELS } from '@/domain/value-objects/MemberPosition';
import CardCarousel from '@/components/public/CardCarousel';

const CAROUSEL_SIZE = 8;

export default async function HomePage() {
  const tenant = await getCurrentTenant();
  const accent = accentClasses(resolveAccent(tenant.primaryColor));

  const newsRepo = new PostgresNewsRepository();
  const publicationRepo = new PostgresPublicationRepository();

  const [settings, news, featuredNews, publications, featuredPublications, researchPosts, members] =
    await Promise.all([
      new PostgresSiteSettingsRepository().getByTenant(tenant.id),
      newsRepo.listPublished(tenant.id),
      newsRepo.listFeatured(tenant.id, CAROUSEL_SIZE),
      publicationRepo.listPublished(tenant.id, { sort: 'year_desc' }),
      publicationRepo.listFeatured(tenant.id, CAROUSEL_SIZE),
      new PostgresPostRepository().listPublished(tenant.id, 'research'),
      listMembers(tenant.id, { repo: new PostgresMemberRepository() }),
    ]);

  const latestNews = buildCarouselItems(featuredNews, news, CAROUSEL_SIZE);
  const latestPublications = buildCarouselItems(featuredPublications, publications, CAROUSEL_SIZE);
  const peopleTeaser = members.filter((member) => member.position !== 'Alumnus').slice(0, CAROUSEL_SIZE);
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
        {latestNews.length > 0 ? (
          <CardCarousel>
            {latestNews.map((item) => (
              <article
                key={item.id}
                className="w-72 shrink-0 snap-start rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:w-80"
              >
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt={item.imageAlt ?? ''}
                    className="h-36 w-full rounded-t-xl object-cover"
                  />
                ) : (
                  <div className={`h-36 w-full rounded-t-xl ${accent.bg50}`} />
                )}
                <div className="p-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    {new Date(item.publishedDate).toLocaleDateString()}
                  </p>
                  <h3 className="mt-2 font-display text-lg font-semibold leading-snug text-slate-900 line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="mt-2 line-clamp-3 text-sm text-slate-600">{item.body}</p>
                </div>
              </article>
            ))}
          </CardCarousel>
        ) : (
          <p className="mt-6 text-slate-500">No news yet — check back soon.</p>
        )}
      </section>

      <section className={`${accent.bg50} py-16`}>
        <div className="mx-auto max-w-content px-6">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-semibold text-slate-900">Recent publications</h2>
            <Link href="/publications" className={`text-sm font-medium ${accent.text600} hover:underline`}>
              View all →
            </Link>
          </div>
          {latestPublications.length > 0 ? (
            <CardCarousel>
              {latestPublications.map((pub) => (
                <article
                  key={pub.id}
                  className="flex w-72 shrink-0 snap-start flex-col rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md sm:w-80"
                >
                  <p className={`text-xs font-semibold ${accent.text600}`}>{pub.year}</p>
                  <h3 className="mt-2 font-display text-base font-semibold leading-snug text-slate-900 line-clamp-3">
                    {pub.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">{pub.authors}</p>
                  {pub.venue && <p className="mt-1 text-xs italic text-slate-500 line-clamp-1">{pub.venue}</p>}
                  {(pub.doiOrLink || pub.pdfUrl) && (
                    <a
                      href={pub.doiOrLink ?? pub.pdfUrl ?? '#'}
                      target="_blank"
                      rel="noreferrer"
                      className={`mt-auto pt-3 text-sm font-medium ${accent.text600} hover:underline`}
                    >
                      View publication →
                    </a>
                  )}
                </article>
              ))}
            </CardCarousel>
          ) : (
            <p className="mt-6 text-slate-500">No publications listed yet.</p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-content px-6 py-16">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-semibold text-slate-900">Our people</h2>
          <Link href="/people" className={`text-sm font-medium ${accent.text600} hover:underline`}>
            Meet the team →
          </Link>
        </div>
        {peopleTeaser.length > 0 ? (
          <CardCarousel>
            {peopleTeaser.map((member) => (
              <Link
                key={member.id}
                href="/people"
                className="w-48 shrink-0 snap-start overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md sm:w-56"
              >
                <div className={`aspect-square w-full overflow-hidden ${accent.bg100}`}>
                  {member.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={member.photoUrl}
                      alt={member.photoAlt ?? member.fullName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className={`flex h-full w-full items-center justify-center font-display text-4xl ${accent.text600}`}>
                      {member.fullName.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="p-4 text-center">
                  <p className="font-display text-base font-semibold text-slate-900">{member.fullName}</p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                    {MEMBER_POSITION_LABELS[member.position]}
                  </p>
                </div>
              </Link>
            ))}
          </CardCarousel>
        ) : (
          <p className="mt-6 text-slate-500">No team members listed yet.</p>
        )}
      </section>
    </main>
  );
}
