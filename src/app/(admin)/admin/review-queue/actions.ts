'use server';

import { revalidatePath } from 'next/cache';
import { PostgresPublicationRepository } from '@/infrastructure/repositories/PostgresPublicationRepository';
import { PostgresNewsRepository } from '@/infrastructure/repositories/PostgresNewsRepository';
import { PostgresPostRepository } from '@/infrastructure/repositories/PostgresPostRepository';
import { reviewPublication } from '@/application/use-cases/publications/ApprovePublication';
import { reviewNewsItem } from '@/application/use-cases/news/ApproveNewsItem';
import { reviewPost } from '@/application/use-cases/posts/ApprovePost';
import { getUseCaseContext } from '@/lib/useCaseContext';

export type ContentKind = 'publication' | 'news' | 'post';

export async function approveItemAction(kind: ContentKind, id: string): Promise<void> {
  const ctx = await getUseCaseContext();
  if (kind === 'publication') {
    await reviewPublication(id, { approve: true }, ctx, { repo: new PostgresPublicationRepository() });
  } else if (kind === 'news') {
    await reviewNewsItem(id, { approve: true }, ctx, { repo: new PostgresNewsRepository() });
  } else {
    await reviewPost(id, { approve: true }, ctx, { repo: new PostgresPostRepository() });
  }
  revalidatePath('/admin/review-queue');
}

export async function rejectItemAction(kind: ContentKind, id: string, formData: FormData): Promise<void> {
  const note = String(formData.get('note') ?? '');
  const ctx = await getUseCaseContext();
  if (kind === 'publication') {
    await reviewPublication(id, { approve: false, note }, ctx, { repo: new PostgresPublicationRepository() });
  } else if (kind === 'news') {
    await reviewNewsItem(id, { approve: false, note }, ctx, { repo: new PostgresNewsRepository() });
  } else {
    await reviewPost(id, { approve: false, note }, ctx, { repo: new PostgresPostRepository() });
  }
  revalidatePath('/admin/review-queue');
}
