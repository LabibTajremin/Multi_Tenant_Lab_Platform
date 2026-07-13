'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { PostgresMemberRepository } from '@/infrastructure/repositories/PostgresMemberRepository';
import { createMemberProfile } from '@/application/use-cases/members/CreateMemberProfile';
import { updateMemberProfile } from '@/application/use-cases/members/UpdateMemberProfile';
import { deleteMemberProfile } from '@/application/use-cases/members/DeleteMemberProfile';
import { getUseCaseContext } from '@/lib/useCaseContext';
import { toFormState, type FormState } from '@/lib/formState';
import { deleteStoredFile } from '@/lib/deleteStorageObject';
import type { LinkPlatform } from '@/domain/value-objects/LinkPlatform';
import { LINK_PLATFORMS } from '@/domain/value-objects/LinkPlatform';

function parseLinks(formData: FormData): { platform: LinkPlatform; url: string }[] {
  return LINK_PLATFORMS.map((platform) => ({ platform, url: String(formData.get(`link_${platform}`) ?? '').trim() })).filter(
    (l) => l.url.length > 0,
  );
}

function parseCreateInput(formData: FormData) {
  return {
    fullName: String(formData.get('fullName') ?? ''),
    position: String(formData.get('position') ?? ''),
    bio: String(formData.get('bio') ?? '') || undefined,
    contactEmail: String(formData.get('contactEmail') ?? '') || undefined,
    photoUrl: String(formData.get('photoUrl') ?? '') || undefined,
    photoAlt: String(formData.get('photoAlt') ?? '') || undefined,
    joinDate: String(formData.get('joinDate') ?? '') || undefined,
    leaveDate: String(formData.get('leaveDate') ?? '') || undefined,
    links: parseLinks(formData),
  };
}

export async function createMemberProfileAction(_prevState: FormState, formData: FormData): Promise<FormState> {
  const repo = new PostgresMemberRepository();
  try {
    const ctx = await getUseCaseContext();
    await createMemberProfile(parseCreateInput(formData), ctx, { repo });
  } catch (error) {
    return toFormState(error);
  }
  revalidatePath('/admin/members');
  redirect('/admin/members');
}

export async function updateMemberProfileAction(
  id: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const repo = new PostgresMemberRepository();
  try {
    const ctx = await getUseCaseContext();
    await updateMemberProfile(id, parseCreateInput(formData), ctx, { repo });
  } catch (error) {
    return toFormState(error);
  }
  revalidatePath('/admin/members');
  redirect('/admin/members');
}

export async function deleteMemberProfileAction(id: string): Promise<void> {
  const repo = new PostgresMemberRepository();
  const ctx = await getUseCaseContext();
  const existing = await repo.findById(ctx.tenantId, id);
  await deleteMemberProfile(id, ctx, { repo });
  await deleteStoredFile(existing?.photoUrl);
  revalidatePath('/admin/members');
}
