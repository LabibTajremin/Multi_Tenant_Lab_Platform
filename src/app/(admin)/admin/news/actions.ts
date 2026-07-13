'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { PostgresNewsRepository } from '@/infrastructure/repositories/PostgresNewsRepository';
import { createNewsItem } from '@/application/use-cases/news/CreateNewsItem';
import { updateNewsItem } from '@/application/use-cases/news/UpdateNewsItem';
import { deleteNewsItem } from '@/application/use-cases/news/DeleteNewsItem';
import { getUseCaseContext } from '@/lib/useCaseContext';
import { toFormState, type FormState } from '@/lib/formState';

function parseInput(formData: FormData) {
  const publishedDate = String(formData.get('publishedDate') ?? '');
  return {
    title: String(formData.get('title') ?? ''),
    body: String(formData.get('body') ?? ''),
    imageUrl: String(formData.get('imageUrl') ?? '') || undefined,
    imageAlt: String(formData.get('imageAlt') ?? '') || undefined,
    linkUrl: String(formData.get('linkUrl') ?? '') || undefined,
    publishedDate: publishedDate || undefined,
  };
}

export async function createNewsItemAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const repo = new PostgresNewsRepository();
  try {
    const ctx = await getUseCaseContext();
    await createNewsItem(parseInput(formData), ctx, { repo });
  } catch (error) {
    return toFormState(error);
  }
  revalidatePath('/admin/news');
  redirect('/admin/news');
}

export async function updateNewsItemAction(id: string, _prevState: FormState, formData: FormData): Promise<FormState> {
  const repo = new PostgresNewsRepository();
  try {
    const ctx = await getUseCaseContext();
    await updateNewsItem(id, parseInput(formData), ctx, { repo });
  } catch (error) {
    return toFormState(error);
  }
  revalidatePath('/admin/news');
  redirect('/admin/news');
}

export async function deleteNewsItemAction(id: string): Promise<void> {
  const repo = new PostgresNewsRepository();
  const ctx = await getUseCaseContext();
  await deleteNewsItem(id, ctx, { repo });
  revalidatePath('/admin/news');
}
