import type { Publication } from '../entities/Publication';
import type { ContentStatus } from '../value-objects/ContentStatus';

export interface NewPublicationInput {
  tenantId: string;
  title: string;
  authors: string;
  venue?: string | null;
  year: number;
  doiOrLink?: string | null;
  pdfUrl?: string | null;
  status: ContentStatus;
  isFeatured?: boolean;
  createdBy: string;
}

export interface PublicationPatch {
  title?: string;
  authors?: string;
  venue?: string | null;
  year?: number;
  doiOrLink?: string | null;
  pdfUrl?: string | null;
  status?: ContentStatus;
  reviewNote?: string | null;
  reviewedBy?: string | null;
  isFeatured?: boolean;
}

export interface PublishedPublicationQuery {
  search?: string;
  year?: number;
  sort?: 'year_desc' | 'year_asc';
}

export interface IPublicationRepository {
  findById(tenantId: string, id: string): Promise<Publication | null>;
  /** Enforces `status = 'published'` in the query itself (Section 7) — never trust the UI alone. */
  listPublished(tenantId: string, query?: PublishedPublicationQuery): Promise<Publication[]>;
  /** Published + is_featured = true, for the home page carousel. Callers fall
   * back to listPublished() themselves when this returns fewer than they need. */
  listFeatured(tenantId: string, limit: number): Promise<Publication[]>;
  listAll(tenantId: string): Promise<Publication[]>;
  listPending(tenantId: string): Promise<Publication[]>;
  create(input: NewPublicationInput): Promise<Publication>;
  update(tenantId: string, id: string, patch: PublicationPatch): Promise<Publication>;
  delete(tenantId: string, id: string): Promise<void>;
}
