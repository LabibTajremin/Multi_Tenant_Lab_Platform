'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { PostgresPostRepository } from '@/infrastructure/repositories/PostgresPostRepository';
import { createPost } from '@/application/use-cases/posts/CreatePost';
import { updatePost } from '@/application/use-cases/posts/UpdatePost';
import { deletePost } from '@/application/use-cases/posts/DeletePost';
import { getUseCaseContext } from '@/lib/useCaseContext';
import { toFormState, type FormState } from '@/lib/formState';
import { deleteStoredFile } from '@/lib/deleteStorageObject';

function parseCreateInput(formData: FormData) {
  return {
    postType: String(formData.get('postType') ?? ''),
    title: String(formData.get('title') ?? ''),
    body: String(formData.get('body') ?? '') || undefined,
    imageUrl: String(formData.get('imageUrl') ?? '') || undefined,
    imageAlt: String(formData.get('imageAlt') ?? '') || undefined,
  };
}

function parseUpdateInput(formData: FormData) {
  return {
    title: String(formData.get('title') ?? ''),
    body: String(formData.get('body') ?? '') || undefined,
    imageUrl: String(formData.get('imageUrl') ?? '') || undefined,
    imageAlt: String(formData.get('imageAlt') ?? '') || undefined,
  };
}

export async function createPostAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const repo = new PostgresPostRepository();
  try {
    const ctx = await getUseCaseContext();
    await createPost(parseCreateInput(formData), ctx, { repo });
  } catch (error) {
    return toFormState(error);
  }
  revalidatePath('/admin/posts');
  redirect('/admin/posts');
}

export async function updatePostAction(id: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  const repo = new PostgresPostRepository();
  try {
    const ctx = await getUseCaseContext();
    await updatePost(id, parseUpdateInput(formData), ctx, { repo });
  } catch (error) {
    return toFormState(error);
  }
  revalidatePath('/admin/posts');
  redirect('/admin/posts');
}

export async function deletePostAction(id: string): Promise<void> {
  const repo = new PostgresPostRepository();
  const ctx = await getUseCaseContext();
  const existing = await repo.findById(ctx.tenantId, id);
  await deletePost(id, ctx, { repo });
  await deleteStoredFile(existing?.imageUrl);
  revalidatePath('/admin/posts');
}
