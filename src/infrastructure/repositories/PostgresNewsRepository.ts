import type { NewsItem } from '@/domain/entities/NewsItem';
import type { INewsRepository, NewNewsItemInput, NewsItemPatch } from '@/domain/repositories/INewsRepository';
import { withTenantScope } from '../db/client';
import { idToStatus, statusToId } from '../db/lookupMaps';

const PUBLISHED_STATUS_ID = statusToId('published');
const PENDING_STATUS_ID = statusToId('pending_review');

interface NewsRow {
  id: string;
  tenant_id: string;
  title: string;
  body: string;
  image_url: string | null;
  image_alt: string | null;
  link_url: string | null;
  status_id: number;
  review_note: string | null;
  created_by: string;
  reviewed_by: string | null;
  published_date: Date;
  created_at: Date;
  updated_at: Date;
}

function toEntity(row: NewsRow): NewsItem {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    title: row.title,
    body: row.body,
    imageUrl: row.image_url,
    imageAlt: row.image_alt,
    linkUrl: row.link_url,
    status: idToStatus(row.status_id),
    reviewNote: row.review_note,
    createdBy: row.created_by,
    reviewedBy: row.reviewed_by,
    publishedDate: row.published_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class PostgresNewsRepository implements INewsRepository {
  async findById(tenantId: string, id: string): Promise<NewsItem | null> {
    return withTenantScope(tenantId, async (client) => {
      const result = await client.query<NewsRow>('SELECT * FROM news_items WHERE tenant_id = $1 AND id = $2', [
        tenantId,
        id,
      ]);
      return result.rows[0] ? toEntity(result.rows[0]) : null;
    });
  }

  // Public /news page (Section 12): always filters status = 'published' in the
  // query itself — the UI must never be the only thing hiding drafts.
  async listPublished(tenantId: string): Promise<NewsItem[]> {
    return withTenantScope(tenantId, async (client) => {
      const result = await client.query<NewsRow>(
        'SELECT * FROM news_items WHERE tenant_id = $1 AND status_id = $2 ORDER BY published_date DESC',
        [tenantId, PUBLISHED_STATUS_ID],
      );
      return result.rows.map(toEntity);
    });
  }

  async listAll(tenantId: string): Promise<NewsItem[]> {
    return withTenantScope(tenantId, async (client) => {
      const result = await client.query<NewsRow>(
        'SELECT * FROM news_items WHERE tenant_id = $1 ORDER BY published_date DESC',
        [tenantId],
      );
      return result.rows.map(toEntity);
    });
  }

  async listPending(tenantId: string): Promise<NewsItem[]> {
    return withTenantScope(tenantId, async (client) => {
      const result = await client.query<NewsRow>(
        'SELECT * FROM news_items WHERE tenant_id = $1 AND status_id = $2 ORDER BY created_at ASC',
        [tenantId, PENDING_STATUS_ID],
      );
      return result.rows.map(toEntity);
    });
  }

  async create(input: NewNewsItemInput): Promise<NewsItem> {
    return withTenantScope(input.tenantId, async (client) => {
      const result = await client.query<NewsRow>(
        `INSERT INTO news_items (tenant_id, title, body, image_url, image_alt, link_url, status_id, created_by, published_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, CURRENT_DATE))
         RETURNING *`,
        [
          input.tenantId,
          input.title,
          input.body,
          input.imageUrl ?? null,
          input.imageAlt ?? null,
          input.linkUrl ?? null,
          statusToId(input.status),
          input.createdBy,
          input.publishedDate ?? null,
        ],
      );
      const row = result.rows[0];
      if (!row) {
        throw new Error('Failed to create news item');
      }
      return toEntity(row);
    });
  }

  async update(tenantId: string, id: string, patch: NewsItemPatch): Promise<NewsItem> {
    return withTenantScope(tenantId, async (client) => {
      const result = await client.query<NewsRow>(
        `UPDATE news_items SET
           title = COALESCE($3, title),
           body = COALESCE($4, body),
           image_url = COALESCE($5, image_url),
           image_alt = COALESCE($6, image_alt),
           link_url = COALESCE($7, link_url),
           status_id = COALESCE($8, status_id),
           review_note = COALESCE($9, review_note),
           reviewed_by = COALESCE($10, reviewed_by),
           published_date = COALESCE($11, published_date),
           updated_at = now()
         WHERE tenant_id = $1 AND id = $2
         RETURNING *`,
        [
          tenantId,
          id,
          patch.title,
          patch.body,
          patch.imageUrl,
          patch.imageAlt,
          patch.linkUrl,
          patch.status ? statusToId(patch.status) : null,
          patch.reviewNote,
          patch.reviewedBy,
          patch.publishedDate,
        ],
      );
      const row = result.rows[0];
      if (!row) {
        throw new Error(`News item not found: ${id}`);
      }
      return toEntity(row);
    });
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await withTenantScope(tenantId, async (client) => {
      await client.query('DELETE FROM news_items WHERE tenant_id = $1 AND id = $2', [tenantId, id]);
    });
  }
}
