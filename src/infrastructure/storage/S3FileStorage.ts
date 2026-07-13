import { randomUUID } from 'node:crypto';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getEnv } from '@/lib/env';

export type UploadCategory = 'photo' | 'banner' | 'logo' | 'pdf' | 'image';

let client: S3Client | undefined;

function getClient(): S3Client {
  if (!client) {
    const env = getEnv();
    client = new S3Client({
      endpoint: env.STORAGE_ENDPOINT,
      region: env.STORAGE_REGION,
      forcePathStyle: env.STORAGE_FORCE_PATH_STYLE,
      credentials: {
        accessKeyId: env.STORAGE_ACCESS_KEY_ID,
        secretAccessKey: env.STORAGE_SECRET_ACCESS_KEY,
      },
    });
  }
  return client;
}

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100);
}

/**
 * One shared bucket across every tenant deployment (Section 11), with objects
 * keyed under a tenant-prefixed path so a tenant's storage can be deleted or
 * exported by prefix alone: <tenant_id>/<category>/<uuid>-<filename>.
 */
export class S3FileStorage {
  async upload(
    tenantId: string,
    category: UploadCategory,
    filename: string,
    body: Buffer,
    contentType: string,
  ): Promise<{ key: string; url: string }> {
    const env = getEnv();
    const key = `${tenantId}/${category}/${randomUUID()}-${sanitizeFilename(filename)}`;

    await getClient().send(
      new PutObjectCommand({
        Bucket: env.STORAGE_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );

    return { key, url: this.publicUrl(key) };
  }

  async delete(key: string): Promise<void> {
    const env = getEnv();
    await getClient().send(new DeleteObjectCommand({ Bucket: env.STORAGE_BUCKET, Key: key }));
  }

  publicUrl(key: string): string {
    const env = getEnv();
    return `${env.STORAGE_PUBLIC_BASE_URL.replace(/\/$/, '')}/${key}`;
  }

  /** Recovers the object key from a public URL this class generated, so a
   * repository row's stored URL can be deleted without keeping the key
   * separately. Returns null for URLs this deployment's bucket didn't issue
   * (e.g., an Admin pasted an external image link instead of uploading). */
  keyFromUrl(url: string): string | null {
    const env = getEnv();
    const base = `${env.STORAGE_PUBLIC_BASE_URL.replace(/\/$/, '')}/`;
    if (!url.startsWith(base)) {
      return null;
    }
    return url.slice(base.length);
  }
}
