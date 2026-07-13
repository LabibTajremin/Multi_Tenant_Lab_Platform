import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getSessionUser } from '@/lib/session';
import { getTenantId } from '@/lib/tenantContext';
import { PostgresUserRepository } from '@/infrastructure/repositories/PostgresUserRepository';

const bodySchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: Request): Promise<NextResponse> {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input.' }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  const userRepo = new PostgresUserRepository();
  await userRepo.setPasswordHash(getTenantId(), user.id, passwordHash, false);

  return NextResponse.json({ ok: true });
}
