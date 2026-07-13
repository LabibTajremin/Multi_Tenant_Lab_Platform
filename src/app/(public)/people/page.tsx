import { getCurrentTenant } from '@/lib/tenantContext';
import { listMembers } from '@/application/use-cases/members/ListMembers';
import { PostgresMemberRepository } from '@/infrastructure/repositories/PostgresMemberRepository';
import type { Member } from '@/domain/entities/Member';
import type { MemberPosition } from '@/domain/value-objects/MemberPosition';
import { resolveAccent, accentClasses } from '@/lib/accent';

const SECTION_LABELS: Record<MemberPosition, string> = {
  PI: 'Principal Investigator',
  Postdoc: 'Postdoctoral Researchers',
  PhD: 'PhD Students',
  MS: 'MS Students',
  Undergrad: 'Undergraduate Researchers',
  Alumnus: 'Alumni',
};

function MemberCard({ member, accent }: { member: Member; accent: ReturnType<typeof accentClasses> }) {
  return (
    <div className="rounded-lg border border-slate-200 p-5">
      <div className={`h-24 w-24 overflow-hidden rounded-full ${accent.bg100}`}>
        {member.photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={member.photoUrl} alt={member.photoAlt ?? member.fullName} className="h-full w-full object-cover" />
        )}
      </div>
      <p className="mt-3 font-medium text-slate-900">{member.fullName}</p>
      {member.bio && <p className="mt-1 line-clamp-4 text-sm text-slate-600">{member.bio}</p>}
      {member.links.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {member.links.map((link) => (
            <a
              key={link.platform}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className={`text-xs font-medium ${accent.text600} hover:underline`}
            >
              {link.platform.replace('_', ' ')}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default async function PeoplePage() {
  const tenant = await getCurrentTenant();
  const accent = accentClasses(resolveAccent(tenant.primaryColor));
  const members = await listMembers(tenant.id, { repo: new PostgresMemberRepository() });

  const sections: { position: MemberPosition; members: Member[] }[] = (
    ['PI', 'Postdoc', 'PhD', 'MS', 'Undergrad', 'Alumnus'] as MemberPosition[]
  )
    .map((position) => ({ position, members: members.filter((m) => m.position === position) }))
    .filter((section) => section.members.length > 0);

  return (
    <main className="mx-auto max-w-content px-6 py-16">
      <h1 className="font-display text-3xl font-semibold text-slate-900">People</h1>

      {sections.length === 0 && <p className="mt-6 text-slate-600">No team members listed yet.</p>}

      <div className="mt-10 space-y-14">
        {sections.map((section) =>
          section.position === 'Alumnus' ? (
            <details key={section.position} className="group">
              <summary className="cursor-pointer font-display text-xl font-semibold text-slate-900">
                {SECTION_LABELS[section.position]} ({section.members.length})
              </summary>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {section.members.map((member) => (
                  <MemberCard key={member.id} member={member} accent={accent} />
                ))}
              </div>
            </details>
          ) : (
            <div key={section.position}>
              <h2 className="font-display text-xl font-semibold text-slate-900">{SECTION_LABELS[section.position]}</h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {section.members.map((member) => (
                  <MemberCard key={member.id} member={member} accent={accent} />
                ))}
              </div>
            </div>
          ),
        )}
      </div>
    </main>
  );
}
