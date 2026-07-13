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
  listAll(tenantId: string): Promise<Publication[]>;
  listPending(tenantId: string): Promise<Publication[]>;
  create(input: NewPublicationInput): Promise<Publication>;
  update(tenantId: string, id: string, patch: PublicationPatch): Promise<Publication>;
  delete(tenantId: string, id: string): Promise<void>;
}
