import type { NewsItem } from '../entities/NewsItem';
import type { ContentStatus } from '../value-objects/ContentStatus';

export interface NewNewsItemInput {
  tenantId: string;
  title: string;
  body: string;
  imageUrl?: string | null;
  imageAlt?: string | null;
  linkUrl?: string | null;
  status: ContentStatus;
  isFeatured?: boolean;
  createdBy: string;
  publishedDate?: Date;
}

export interface NewsItemPatch {
  title?: string;
  body?: string;
  imageUrl?: string | null;
  imageAlt?: string | null;
  linkUrl?: string | null;
  status?: ContentStatus;
  reviewNote?: string | null;
  reviewedBy?: string | null;
  isFeatured?: boolean;
  publishedDate?: Date;
}

export interface INewsRepository {
  findById(tenantId: string, id: string): Promise<NewsItem | null>;
  /** Enforces `status = 'published'` in the query itself (Section 7) — never trust the UI alone. */
  listPublished(tenantId: string): Promise<NewsItem[]>;
  /** Published + is_featured = true, for the home page carousel. Callers fall
   * back to listPublished() themselves when this returns fewer than they need. */
  listFeatured(tenantId: string, limit: number): Promise<NewsItem[]>;
  listAll(tenantId: string): Promise<NewsItem[]>;
  listPending(tenantId: string): Promise<NewsItem[]>;
  create(input: NewNewsItemInput): Promise<NewsItem>;
  update(tenantId: string, id: string, patch: NewsItemPatch): Promise<NewsItem>;
  delete(tenantId: string, id: string): Promise<void>;
}
