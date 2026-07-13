import type { UploadCategory } from '@/infrastructure/storage/S3FileStorage';

// Section 11: enforce type/size limits server-side — never trust client-side
// validation alone.
const IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};
const PDF_TYPE = 'application/pdf';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_PDF_BYTES = 20 * 1024 * 1024; // 20MB

export interface UploadValidationResult {
  ok: boolean;
  error?: string;
}

export function validateUpload(category: UploadCategory, contentType: string, size: number): UploadValidationResult {
  if (category === 'pdf') {
    if (contentType !== PDF_TYPE) {
      return { ok: false, error: 'Only PDF files are allowed here.' };
    }
    if (size > MAX_PDF_BYTES) {
      return { ok: false, error: 'PDF files must be 20MB or smaller.' };
    }
    return { ok: true };
  }

  if (!(contentType in IMAGE_TYPES)) {
    return { ok: false, error: 'Only JPG, PNG, or WEBP images are allowed here.' };
  }
  if (size > MAX_IMAGE_BYTES) {
    return { ok: false, error: 'Images must be 5MB or smaller.' };
  }
  return { ok: true };
}
