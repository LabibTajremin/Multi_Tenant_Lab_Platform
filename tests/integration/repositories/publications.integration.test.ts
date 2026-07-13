import { describe, expect, it } from 'vitest';
import { PostgresPublicationRepository } from '@/infrastructure/repositories/PostgresPublicationRepository';
import { seedTenant } from '../helpers/seedTenants';

describe('PostgresPublicationRepository', () => {
  it('listPublished only returns published rows, never draft/pending/rejected ones', async () => {
    const seeded = await seedTenant('pub-visibility');
    const repo = new PostgresPublicationRepository();

    const pending = await repo.create({
      tenantId: seeded.tenant.id,
      title: 'Unreviewed submission',
      authors: 'Someone',
      year: 2025,
      status: 'pending_review',
      createdBy: seeded.admin.id,
    });
    const rejected = await repo.create({
      tenantId: seeded.tenant.id,
      title: 'Rejected submission',
      authors: 'Someone',
      year: 2025,
      status: 'rejected',
      createdBy: seeded.admin.id,
    });

    const published = await repo.listPublished(seeded.tenant.id);
    const ids = published.map((p) => p.id);
    expect(ids).toContain(seeded.publication.id);
    expect(ids).not.toContain(pending.id);
    expect(ids).not.toContain(rejected.id);
  });

  it('listPending returns only pending_review rows, for the admin review queue', async () => {
    const seeded = await seedTenant('pub-pending');
    const repo = new PostgresPublicationRepository();

    const pending = await repo.create({
      tenantId: seeded.tenant.id,
      title: 'Awaiting review',
      authors: 'Someone',
      year: 2025,
      status: 'pending_review',
      createdBy: seeded.admin.id,
    });

    const queue = await repo.listPending(seeded.tenant.id);
    expect(queue.map((p) => p.id)).toEqual([pending.id]);
  });

  it('approving a pending publication (status update) makes it visible via listPublished', async () => {
    const seeded = await seedTenant('pub-approve');
    const repo = new PostgresPublicationRepository();

    const pending = await repo.create({
      tenantId: seeded.tenant.id,
      title: 'To be approved',
      authors: 'Someone',
      year: 2025,
      status: 'pending_review',
      createdBy: seeded.admin.id,
    });

    await repo.update(seeded.tenant.id, pending.id, { status: 'published', reviewedBy: seeded.admin.id });

    const published = await repo.listPublished(seeded.tenant.id);
    expect(published.map((p) => p.id)).toContain(pending.id);
  });

  it('full-text search matches title and authors (Section 9.1 publications search)', async () => {
    const seeded = await seedTenant('pub-search');
    const repo = new PostgresPublicationRepository();

    await repo.create({
      tenantId: seeded.tenant.id,
      title: 'Quantum Entanglement in Polymer Networks',
      authors: 'Grace Hopper',
      year: 2024,
      status: 'published',
      createdBy: seeded.admin.id,
    });

    const byTitle = await repo.listPublished(seeded.tenant.id, { search: 'Quantum' });
    expect(byTitle.some((p) => p.title.includes('Quantum'))).toBe(true);

    const byAuthor = await repo.listPublished(seeded.tenant.id, { search: 'Hopper' });
    expect(byAuthor.some((p) => p.authors.includes('Hopper'))).toBe(true);

    const noMatch = await repo.listPublished(seeded.tenant.id, { search: 'Nonexistent Topic Zzz' });
    expect(noMatch).toHaveLength(0);
  });

  it('filters and sorts by year for the public publications page', async () => {
    const seeded = await seedTenant('pub-year');
    const repo = new PostgresPublicationRepository();

    await repo.create({
      tenantId: seeded.tenant.id,
      title: 'Older paper',
      authors: 'A',
      year: 2020,
      status: 'published',
      createdBy: seeded.admin.id,
    });
    await repo.create({
      tenantId: seeded.tenant.id,
      title: 'Newer paper',
      authors: 'A',
      year: 2026,
      status: 'published',
      createdBy: seeded.admin.id,
    });

    const desc = await repo.listPublished(seeded.tenant.id, { sort: 'year_desc' });
    const years = desc.map((p) => p.year);
    expect(years).toEqual([...years].sort((a, b) => b - a));

    const only2020 = await repo.listPublished(seeded.tenant.id, { year: 2020 });
    expect(only2020.every((p) => p.year === 2020)).toBe(true);
  });
});
