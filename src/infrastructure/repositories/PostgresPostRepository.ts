import type { Post } from '@/domain/entities/Post';
import type { IPostRepository, NewPostInput, PostPatch } from '@/domain/repositories/IPostRepository';
import type { PostType } from '@/domain/value-objects/PostType';
import { withTenantScope } from '../db/client';
import { idToPostType, idToStatus, postTypeToId, statusToId } from '../db/lookupMaps';

const PUBLISHED_STATUS_ID = statusToId('published');
const PENDING_STATUS_ID = statusToId('pending_review');

interface PostRow {
  id: string;
  tenant_id: string;
  post_type_id: number;
  title: string;
  body: string | null;
  image_url: string | null;
  image_alt: string | null;
  status_id: number;
  review_note: string | null;
  created_by: string;
  reviewed_by: string | null;
  created_at: Date;
  updated_at: Date;
}

function toEntity(row: PostRow): Post {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    postType: idToPostType(row.post_type_id),
    title: row.title,
    body: row.body,
    imageUrl: row.image_url,
    imageAlt: row.image_alt,
    status: idToStatus(row.status_id),
    reviewNote: row.review_note,
    createdBy: row.created_by,
    reviewedBy: row.reviewed_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class PostgresPostRepository implements IPostRepository {
  async findById(tenantId: string, id: string): Promise<Post | null> {
    return withTenantScope(tenantId, async (client) => {
      const result = await client.query<PostRow>('SELECT * FROM posts WHERE tenant_id = $1 AND id = $2', [
        tenantId,
        id,
      ]);
      return result.rows[0] ? toEntity(result.rows[0]) : null;
    });
  }

  // Public /funding and /gallery pages (Section 12): always filters status =
  // 'published' in the query itself — the UI must never be the only thing hiding drafts.
  async listPublished(tenantId: string, postType: PostType): Promise<Post[]> {
    return withTenantScope(tenantId, async (client) => {
      const result = await client.query<PostRow>(
        `SELECT * FROM posts WHERE tenant_id = $1 AND post_type_id = $2 AND status_id = $3
         ORDER BY created_at DESC`,
        [tenantId, postTypeToId(postType), PUBLISHED_STATUS_ID],
      );
      return result.rows.map(toEntity);
    });
  }

  async listAll(tenantId: string, postType?: PostType): Promise<Post[]> {
    return withTenantScope(tenantId, async (client) => {
      if (postType) {
        const result = await client.query<PostRow>(
          'SELECT * FROM posts WHERE tenant_id = $1 AND post_type_id = $2 ORDER BY created_at DESC',
          [tenantId, postTypeToId(postType)],
        );
        return result.rows.map(toEntity);
      }
      const result = await client.query<PostRow>(
        'SELECT * FROM posts WHERE tenant_id = $1 ORDER BY created_at DESC',
        [tenantId],
      );
      return result.rows.map(toEntity);
    });
  }

  async listPending(tenantId: string): Promise<Post[]> {
    return withTenantScope(tenantId, async (client) => {
      const result = await client.query<PostRow>(
        'SELECT * FROM posts WHERE tenant_id = $1 AND status_id = $2 ORDER BY created_at ASC',
        [tenantId, PENDING_STATUS_ID],
      );
      return result.rows.map(toEntity);
    });
  }

  async create(input: NewPostInput): Promise<Post> {
    return withTenantScope(input.tenantId, async (client) => {
      const result = await client.query<PostRow>(
        `INSERT INTO posts (tenant_id, post_type_id, title, body, image_url, image_alt, status_id, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          input.tenantId,
          postTypeToId(input.postType),
          input.title,
          input.body ?? null,
          input.imageUrl ?? null,
          input.imageAlt ?? null,
          statusToId(input.status),
          input.createdBy,
        ],
      );
      const row = result.rows[0];
      if (!row) {
        throw new Error('Failed to create post');
      }
      return toEntity(row);
    });
  }

  async update(tenantId: string, id: string, patch: PostPatch): Promise<Post> {
    return withTenantScope(tenantId, async (client) => {
      const result = await client.query<PostRow>(
        `UPDATE posts SET
           title = COALESCE($3, title),
           body = COALESCE($4, body),
           image_url = COALESCE($5, image_url),
           image_alt = COALESCE($6, image_alt),
           status_id = COALESCE($7, status_id),
           review_note = COALESCE($8, review_note),
           reviewed_by = COALESCE($9, reviewed_by),
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
          patch.status ? statusToId(patch.status) : null,
          patch.reviewNote,
          patch.reviewedBy,
        ],
      );
      const row = result.rows[0];
      if (!row) {
        throw new Error(`Post not found: ${id}`);
      }
      return toEntity(row);
    });
  }

  async delete(tenantId: string, id: string): Promise<void> {
    await withTenantScope(tenantId, async (client) => {
      await client.query('DELETE FROM posts WHERE tenant_id = $1 AND id = $2', [tenantId, id]);
    });
  }
}
