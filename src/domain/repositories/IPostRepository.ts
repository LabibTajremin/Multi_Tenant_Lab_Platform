import type { Post } from '../entities/Post';
import type { ContentStatus } from '../value-objects/ContentStatus';
import type { PostType } from '../value-objects/PostType';

export interface NewPostInput {
  tenantId: string;
  postType: PostType;
  title: string;
  body?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  status: ContentStatus;
  createdBy: string;
}

export interface PostPatch {
  title?: string;
  body?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  status?: ContentStatus;
  reviewNote?: string | null;
  reviewedBy?: string | null;
}

export interface IPostRepository {
  findById(tenantId: string, id: string): Promise<Post | null>;
  /** Enforces `status = 'published'` in the query itself (Section 7) — never trust the UI alone. */
  listPublished(tenantId: string, postType: PostType): Promise<Post[]>;
  listAll(tenantId: string, postType?: PostType): Promise<Post[]>;
  listPending(tenantId: string): Promise<Post[]>;
  create(input: NewPostInput): Promise<Post>;
  update(tenantId: string, id: string, patch: PostPatch): Promise<Post>;
  delete(tenantId: string, id: string): Promise<void>;
}
