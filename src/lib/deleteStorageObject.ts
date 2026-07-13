import { S3FileStorage } from '@/infrastructure/storage/S3FileStorage';

/**
 * Best-effort cleanup so a deleted publication/news/post/member doesn't leave
 * an orphaned file in the shared bucket (Section 11). Swallows storage errors
 * — a failed delete-from-storage should never block the DB row from being
 * removed, since the row is the thing the user is waiting on.
 */
export async function deleteStoredFile(url: string | null | undefined): Promise<void> {
  if (!url) {
    return;
  }
  const storage = new S3FileStorage();
  const key = storage.keyFromUrl(url);
  if (!key) {
    // Not one of our uploads (an Admin pasted an external link) — nothing to clean up.
    return;
  }
  try {
    await storage.delete(key);
  } catch (error) {
    console.error(`Failed to delete storage object for key ${key}:`, error);
  }
}
