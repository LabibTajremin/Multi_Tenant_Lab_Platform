import type { ContentStatus } from '../value-objects/ContentStatus';

export interface Publication {
  id: string;
  tenantId: string;
  title: string;
  authors: string;
  venue: string | null;
  year: number;
  doiOrLink: string | null;
  pdfUrl: string | null;
  status: ContentStatus;
  reviewNote: string | null;
  isFeatured: boolean;
  createdBy: string;
  reviewedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}
