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
  publishedDate?: Date;
}

export interface INewsRepository {
  findById(tenantId: string, id: string): Promise<NewsItem | null>;
  /** Enforces `status = 'published'` in the query itself (Section 7) — never trust the UI alone. */
  listPublished(tenantId: string): Promise<NewsItem[]>;
  listAll(tenantId: string): Promise<NewsItem[]>;
  listPending(tenantId: string): Promise<NewsItem[]>;
  create(input: NewNewsItemInput): Promise<NewsItem>;
  update(tenantId: string, id: string, patch: NewsItemPatch): Promise<NewsItem>;
  delete(tenantId: string, id: string): Promise<void>;
}
