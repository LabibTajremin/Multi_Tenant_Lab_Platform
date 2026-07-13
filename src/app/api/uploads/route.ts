import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { getTenantId } from '@/lib/tenantContext';
import { canCreateContent } from '@/lib/rbac';
import { validateUpload } from '@/lib/uploadValidation';
import { S3FileStorage, type UploadCategory } from '@/infrastructure/storage/S3FileStorage';

const VALID_CATEGORIES: UploadCategory[] = ['photo', 'banner', 'logo', 'pdf', 'image'];

export async function POST(request: Request): Promise<NextResponse> {
  const user = await getSessionUser();
  // Every uploader is either an Admin or an Editor creating/editing content —
  // reuses the same "can add content" gate the use cases enforce, since an
  // upload with no content to attach it to is meaningless.
  if (!canCreateContent(user)) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: 'Expected multipart/form-data.' }, { status: 400 });
  }

  const file = formData.get('file');
  const categoryRaw = String(formData.get('category') ?? '');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
  }
  if (!VALID_CATEGORIES.includes(categoryRaw as UploadCategory)) {
    return NextResponse.json({ error: 'Invalid upload category.' }, { status: 400 });
  }
  const category = categoryRaw as UploadCategory;

  const validation = validateUpload(category, file.type, file.size);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const storage = new S3FileStorage();
  const { url } = await storage.upload(getTenantId(), category, file.name, buffer, file.type);

  return NextResponse.json({ url });
}
