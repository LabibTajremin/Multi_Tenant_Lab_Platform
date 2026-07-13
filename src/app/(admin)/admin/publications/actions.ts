'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { PostgresPublicationRepository } from '@/infrastructure/repositories/PostgresPublicationRepository';
import { createPublication } from '@/application/use-cases/publications/CreatePublication';
import { updatePublication } from '@/application/use-cases/publications/UpdatePublication';
import { deletePublication } from '@/application/use-cases/publications/DeletePublication';
import { getUseCaseContext } from '@/lib/useCaseContext';
import { toFormState, type FormState } from '@/lib/formState';

function parseInput(formData: FormData) {
  const year = Number(formData.get('year'));
  return {
    title: String(formData.get('title') ?? ''),
    authors: String(formData.get('authors') ?? ''),
    venue: String(formData.get('venue') ?? '') || undefined,
    year: Number.isFinite(year) ? year : undefined,
    doiOrLink: String(formData.get('doiOrLink') ?? '') || undefined,
    pdfUrl: String(formData.get('pdfUrl') ?? '') || undefined,
  };
}

export async function createPublicationAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const repo = new PostgresPublicationRepository();
  try {
    const ctx = await getUseCaseContext();
    await createPublication(parseInput(formData), ctx, { repo });
  } catch (error) {
    return toFormState(error);
  }
  revalidatePath('/admin/publications');
  redirect('/admin/publications');
}

export async function updatePublicationAction(
  id: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const repo = new PostgresPublicationRepository();
  try {
    const ctx = await getUseCaseContext();
    await updatePublication(id, parseInput(formData), ctx, { repo });
  } catch (error) {
    return toFormState(error);
  }
  revalidatePath('/admin/publications');
  redirect('/admin/publications');
}

export async function deletePublicationAction(id: string): Promise<void> {
  const repo = new PostgresPublicationRepository();
  const ctx = await getUseCaseContext();
  await deletePublication(id, ctx, { repo });
  revalidatePath('/admin/publications');
}
