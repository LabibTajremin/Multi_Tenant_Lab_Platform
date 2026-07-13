import type { ContentStatus } from '../value-objects/ContentStatus';
import type { PostType } from '../value-objects/PostType';

export interface Post {
  id: string;
  tenantId: string;
  postType: PostType;
  title: string;
  body: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  status: ContentStatus;
  reviewNote: string | null;
  createdBy: string;
  reviewedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}
