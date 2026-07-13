import type { Tenant } from '@/domain/entities/Tenant';
import type { User } from '@/domain/entities/User';
import type { Member } from '@/domain/entities/Member';
import type { Publication } from '@/domain/entities/Publication';
import type { NewsItem } from '@/domain/entities/NewsItem';
import type { Post } from '@/domain/entities/Post';
import type { SiteSettings } from '@/domain/entities/SiteSettings';

// Shared mock-data factories (Section 15.2) so unit/integration/E2E tests don't
// hand-roll ad hoc fixture objects. Every factory takes a Partial<T> override so
// callers only specify the fields their test actually cares about.

let uidCounter = 0;
function nextId(prefix: string): string {
  uidCounter += 1;
  return `${prefix}-${uidCounter.toString().padStart(4, '0')}`;
}

export function resetFactoryCounters(): void {
  uidCounter = 0;
}

export function makeTenant(overrides: Partial<Tenant> = {}): Tenant {
  const id = overrides.id ?? nextId('tenant');
  return {
    id,
    slug: `tenant-${id}`,
    labName: 'Test Lab',
    university: 'Test University',
    logoUrl: null,
    theme: 'default',
    primaryColor: 'ocean',
    customDomain: null,
    reviewEnabled: false,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    ...overrides,
  };
}

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: nextId('user'),
    tenantId: overrides.tenantId ?? nextId('tenant'),
    email: 'user@example.edu',
    passwordHash: 'hashed-password',
    role: 'editor',
    displayName: 'Test User',
    mustResetPassword: false,
    isActive: true,
    createdBy: null,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    ...overrides,
  };
}

export function makeMember(overrides: Partial<Member> = {}): Member {
  return {
    id: nextId('member'),
    tenantId: overrides.tenantId ?? nextId('tenant'),
    userId: null,
    fullName: 'Ada Lovelace',
    photoUrl: null,
    photoAlt: null,
    position: 'PhD',
    bio: null,
    contactEmail: null,
    joinDate: null,
    leaveDate: null,
    sortOrder: 0,
    links: [],
    createdAt: new Date('2025-01-01T00:00:00Z'),
    ...overrides,
  };
}

export function makePublication(overrides: Partial<Publication> = {}): Publication {
  return {
    id: nextId('pub'),
    tenantId: overrides.tenantId ?? nextId('tenant'),
    title: 'A Study of Testing Fixtures',
    authors: 'A. Lovelace, C. Babbage',
    venue: 'Journal of Software Testing',
    year: 2025,
    doiOrLink: null,
    pdfUrl: null,
    status: 'published',
    reviewNote: null,
    createdBy: overrides.createdBy ?? nextId('user'),
    reviewedBy: null,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
    ...overrides,
  };
}

export function makeNewsItem(overrides: Partial<NewsItem> = {}): NewsItem {
  return {
    id: nextId('news'),
    tenantId: overrides.tenantId ?? nextId('tenant'),
    title: 'Lab wins award',
    body: 'Details of the award.',
    imageUrl: null,
    imageAlt: null,
    linkUrl: null,
    status: 'published',
    reviewNote: null,
    createdBy: overrides.createdBy ?? nextId('user'),
    reviewedBy: null,
    publishedDate: new Date('2025-01-01T00:00:00Z'),
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
    ...overrides,
  };
}

export function makePost(overrides: Partial<Post> = {}): Post {
  return {
    id: nextId('post'),
    tenantId: overrides.tenantId ?? nextId('tenant'),
    postType: 'funding',
    title: 'NSF Grant #12345',
    body: null,
    imageUrl: null,
    imageAlt: null,
    status: 'published',
    reviewNote: null,
    createdBy: overrides.createdBy ?? nextId('user'),
    reviewedBy: null,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
    ...overrides,
  };
}

export function makeSiteSettings(overrides: Partial<SiteSettings> = {}): SiteSettings {
  return {
    tenantId: overrides.tenantId ?? nextId('tenant'),
    bannerUrl: null,
    tagline: 'Advancing research, together.',
    contactEmail: 'contact@example.edu',
    socialLinks: [],
    updatedAt: new Date('2025-01-01T00:00:00Z'),
    ...overrides,
  };
}
