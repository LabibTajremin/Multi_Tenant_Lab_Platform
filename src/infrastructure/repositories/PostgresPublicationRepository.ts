import type { Publication } from '@/domain/entities/Publication';
import type {
  IPublicationRepository,
  NewPublicationInput,
  PublicationPatch,
  PublishedPublicationQuery,
} from '@/domain/repositories/IPublicationRepository';
import { withTenantScope } from '../db/client';
import { idToStatus, statusToId } from '../db/lookupMaps';

const PUBLISHED_STATUS_ID = statusToId('published');
const PENDING_STATUS_ID = statusToId('pending_review');

interface PublicationRow {
  id: string;
  tenant_id: string;
  title: string;
  authors: string;
  venue: string | null;
  year: number;
  doi_or_link: string | null;
  pdf_url: string | null;
  status_id: number;
  review_note: string | null;
  is_featured: boolean;
  created_by: string;
  reviewed_by: string | null;
  created_at: Date;
  updated_at: Date;
}

function toEntity(row: PublicationRow): Publication {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    title: row.title,
    authors: row.authors,
    venue: row.venue,
    year: row.year,
    doiOrLink: row.doi_or_link,
    pdfUrl: row.pdf_url,
    status: idToStatus(row.status_id),
    reviewNote: row.review_note,
    isFeatured: row.is_featured,
    createdBy: row.created_by,
    reviewedBy: row.reviewed_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class PostgresPublicationRepository implements IPublicationRepository {
  async findById(tenantId: string, id: string): Promise<Publication | null> {
    return withTenantScope(tenantId, async (client) => {
      const result = await client.query<PublicationRow>(
        'SELECT * FROM publications WHERE tenant_id = $1 AND id = $2',
        [tenantId, id],
      );
      return result.rows[0] ? toEntity(result.rows[0]) : null;
    });
  }

  // Public /publications page (Section 12): always filters status = 'published' in
  // the query itself — the UI must never be the only thing hiding drafts.
  async listPublished(tenantId: string, query: PublishedPublicationQuery = {}): Promise<Publication[]> {
    return withTenantScope(tenantId, async (client) => {
      const conditions = ['tenant_id = $1', 'status_id = $2'];
      const params: unknown[] = [tenantId, PUBLISHED_STATUS_ID];

      if (query.year !== undefined) {
        params.push(query.year);
        conditions.push(`year = $${params.length}`);
      }
      if (query.search) {
        params.push(query.search);
        conditions.push(`search_vector @@ plainto_tsquery('english', $${params.length})`);
      }

      const order = query.sort === 'year_asc' ? 'year ASC' : 'year DESC';
      const result = await client.query<PublicationRow>(
        `SELECT * FROM publications WHERE ${conditions.join(' AND ')} ORDER BY ${order}`,
        params,
      );
      return result.rows.map(toEntity);
    });
  }

  // Home page carousel: Admin-curated subset (Section 12 redesign). Backed by
  // idx_publications_featured (tenant_id, year DESC) WHERE is_featured AND published.
  async listFeatured(tenantId: string, limit: number): Promise<Publication[]> {
    return withTenantScope(tenantId, async (client) => {
      const result = await client.query<PublicationRow>(
        `SELECT * FROM publications
         WHERE tenant_id = $1 AND status_id = $2 AND is_featured = true
         ORDER BY year DESC, created_at DESC
         LIMIT $3`,
        [tenantId, PUBLISHED_STATUS_ID, limit],
      );
      return result.rows.map(toEntity);
    });
  }

  async listAll(tenantId: string): Promise<Publication[]> {
    return withTenantScope(tenantId, async (client) => {
      const result = await client.query<PublicationRow>(
        'SELECT * FROM publications WHERE tenant_id = $1 ORDER BY year DESC, created_at DESC',
        [tenantId],
      );
      return result.rows.map(toEntity);
    });
  }

  async listPending(tenantId: string): Promise<Publication[]> {
    return withTenantScope(tenantId, async (client) => {
      const result = await client.query<PublicationRow>(
        'SELECT * FROM publications WHERE tenant_id = $1 AND status_id = $2 ORDER BY created_at ASC',
        [tenantId, PENDING_STATUS_ID],
      );
      return result.rows.map(toEntity);
    });
  }

  async create(input: NewPublicationInput): Promise<Publication> {
    return withTenantScope(input.tenantId, async (client) => {
      const result = await client.query<PublicationRow>(
        `INSERT INTO publications (tenant_id, title, authors, venue, year, doi_or_link, pdf_url, status_id, is_featured, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          input.tenantId,
          input.title,
          input.authors,
          input.venue ?? null,
          input.year,
          input.doiOrLink ?? null,
          input.pdfUrl ?? null,
          statusToId(input.status),
          input.isFeatured ?? false,
          input.createdBy,
        ],
      );
      const row = result.rows[0];
      if (!row) {
        throw new Error('Failed to create publication');
      }
      return toEntity(row);
    });
  }

  async update(tenantId: string, id: string, patch: PublicationPatch): Promise<Publication> {
    return withTenantScope(tenantId, async (client) => {
      const result = await client.query<PublicationRow>(
        `UPDATE publications SET
           title = COALESCE($3, title),
           authors = COALESCE($4, authors),
           venue = COALESCE($5, venue),
           year = COALESCE($6, year),
           doi_or_link = COALESCE($7, doi_or_link),
           pdf_url = COALESCE($8, pdf_url),
           status_id = COALESCE($9, status_id),
           review_note = COALESCE($10, review_note),
           reviewed_by = COALESCE($11, reviewed_by),
           is_featured = COALESCE($12, is_featured),
           updated_at = now()
         WHERE tenant_id = $1 AND id = $2
         RETURNING *`,
        [
          tenantId,
          id,
          patch.title,
          patch.authors,
          patch.venue,
          patch.year,
          patch.doiOrLink,
          patch.pdfUrl,
          patch.status ? statusToId(patch.status) : null,
          patch.reviewNote,
          patch.reviewedBy,
          patch.isFeatured,
        ],
      );
      const row = result.rows[0];
      if (!row) {
        throw new Error(`Publication not found: ${id}`);
      }
      return toEntity(row);
    });
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await withTenantScope(tenantId, async (client) => {
      await client.query('DELETE FROM publications WHERE tenant_id = $1 AND id = $2', [tenantId, id]);
    });
  }
}
