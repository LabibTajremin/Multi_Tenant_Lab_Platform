import type { ContentStatus } from '../value-objects/ContentStatus';

export interface NewsItem {
  id: string;
  tenantId: string;
  title: string;
  body: string;
  imageUrl: string | null;
  imageAlt: string | null;
  linkUrl: string | null;
  status: ContentStatus;
  reviewNote: string | null;
  isFeatured: boolean;
  createdBy: string;
  reviewedBy: string | null;
  publishedDate: Date;
  createdAt: Date;
  updatedAt: Date;
}
