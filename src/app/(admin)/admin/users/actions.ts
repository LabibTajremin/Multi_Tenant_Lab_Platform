'use server';

import { revalidatePath } from 'next/cache';
import { PostgresUserRepository } from '@/infrastructure/repositories/PostgresUserRepository';
import { createEditor } from '@/application/use-cases/auth/CreateEditor';
import { setUserActive } from '@/application/use-cases/auth/SetUserActive';
import { resetUserPassword } from '@/application/use-cases/auth/ResetUserPassword';
import { getUseCaseContext } from '@/lib/useCaseContext';
import { toFormState, type FormState } from '@/lib/formState';

export interface CreateEditorFormState extends FormState {
  temporaryPassword?: string;
  email?: string;
}

export async function createEditorAction(
  _prevState: CreateEditorFormState,
  formData: FormData,
): Promise<CreateEditorFormState> {
  const userRepo = new PostgresUserRepository();
  try {
    const ctx = await getUseCaseContext();
    const input = {
      email: String(formData.get('email') ?? ''),
      displayName: String(formData.get('displayName') ?? ''),
    };
    const result = await createEditor(input, ctx, { userRepo });
    revalidatePath('/admin/users');
    return { temporaryPassword: result.temporaryPassword, email: result.user.email };
  } catch (error) {
    return toFormState(error);
  }
}

export interface ResetPasswordFormState extends FormState {
  temporaryPassword?: string;
}

export async function resetPasswordAction(
  userId: string,
  _prevState: ResetPasswordFormState,
): Promise<ResetPasswordFormState> {
  const userRepo = new PostgresUserRepository();
  try {
    const ctx = await getUseCaseContext();
    const result = await resetUserPassword(userId, ctx, { userRepo });
    return { temporaryPassword: result.temporaryPassword };
  } catch (error) {
    return toFormState(error);
  }
}

export async function toggleUserActiveAction(userId: string, isActive: boolean): Promise<void> {
  const userRepo = new PostgresUserRepository();
  const ctx = await getUseCaseContext();
  await setUserActive(userId, isActive, ctx, { userRepo });
  revalidatePath('/admin/users');
}
