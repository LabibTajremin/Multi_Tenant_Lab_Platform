import { PostgresTenantRepository } from '@/infrastructure/repositories/PostgresTenantRepository';
import { PostgresUserRepository } from '@/infrastructure/repositories/PostgresUserRepository';
import { PostgresMemberRepository } from '@/infrastructure/repositories/PostgresMemberRepository';
import { PostgresPublicationRepository } from '@/infrastructure/repositories/PostgresPublicationRepository';
import { PostgresNewsRepository } from '@/infrastructure/repositories/PostgresNewsRepository';
import { PostgresPostRepository } from '@/infrastructure/repositories/PostgresPostRepository';
import { PostgresSiteSettingsRepository } from '@/infrastructure/repositories/PostgresSiteSettingsRepository';
import type { Tenant } from '@/domain/entities/Tenant';
import type { User } from '@/domain/entities/User';
import type { Member } from '@/domain/entities/Member';
import type { Publication } from '@/domain/entities/Publication';
import type { NewsItem } from '@/domain/entities/NewsItem';
import type { Post } from '@/domain/entities/Post';

export interface SeededTenant {
  tenant: Tenant;
  admin: User;
  member: Member;
  publication: Publication;
  newsItem: NewsItem;
  post: Post;
}

/** Seeds one fully-populated tenant (one row in every tenant-scoped table) via the
 * real Postgres repositories — dogfooding the same code path the app uses. */
export async function seedTenant(slugPrefix: string): Promise<SeededTenant> {
  const unique = `${slugPrefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const tenants = new PostgresTenantRepository();
  const users = new PostgresUserRepository();
  const members = new PostgresMemberRepository();
  const publications = new PostgresPublicationRepository();
  const news = new PostgresNewsRepository();
  const posts = new PostgresPostRepository();
  const siteSettings = new PostgresSiteSettingsRepository();

  const tenant = await tenants.create({ slug: unique, labName: `${unique} Lab`, university: 'Test University' });

  const admin = await users.create({
    tenantId: tenant.id,
    email: `admin@${unique}.edu`,
    passwordHash: 'hashed',
    role: 'admin',
    displayName: 'Test Admin',
    mustResetPassword: false,
  });

  const member = await members.create({
    tenantId: tenant.id,
    fullName: 'Test Member',
    position: 'PhD',
  });

  const publication = await publications.create({
    tenantId: tenant.id,
    title: `Findings from ${unique}`,
    authors: 'Test Author',
    year: 2025,
    status: 'published',
    createdBy: admin.id,
  });

  const newsItem = await news.create({
    tenantId: tenant.id,
    title: `News from ${unique}`,
    body: 'Body text.',
    status: 'published',
    createdBy: admin.id,
  });

  const post = await posts.create({
    tenantId: tenant.id,
    postType: 'funding',
    title: `Grant for ${unique}`,
    status: 'published',
    createdBy: admin.id,
  });

  await siteSettings.upsert(tenant.id, { tagline: `Tagline for ${unique}` });

  return { tenant, admin, member, publication, newsItem, post };
}
