import { describe, expect, it } from 'vitest';
import { validateUpload } from './uploadValidation';

describe('validateUpload', () => {
  it('accepts a JPEG under the image size limit', () => {
    expect(validateUpload('photo', 'image/jpeg', 1024 * 1024)).toEqual({ ok: true });
  });

  it('accepts a PNG and a WEBP', () => {
    expect(validateUpload('image', 'image/png', 1024).ok).toBe(true);
    expect(validateUpload('image', 'image/webp', 1024).ok).toBe(true);
  });

  it('rejects a non-image content type for an image category', () => {
    const result = validateUpload('photo', 'application/pdf', 1024);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/JPG, PNG, or WEBP/);
  });

  it('rejects an image over 5MB', () => {
    const result = validateUpload('banner', 'image/jpeg', 6 * 1024 * 1024);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/5MB/);
  });

  it('accepts a PDF under the 20MB limit for the pdf category', () => {
    expect(validateUpload('pdf', 'application/pdf', 10 * 1024 * 1024)).toEqual({ ok: true });
  });

  it('rejects a non-PDF content type for the pdf category', () => {
    const result = validateUpload('pdf', 'image/jpeg', 1024);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/PDF/);
  });

  it('rejects a PDF over 20MB', () => {
    const result = validateUpload('pdf', 'application/pdf', 21 * 1024 * 1024);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/20MB/);
  });
});
