import { env } from "@/lib/env";
import { LISTING_IMAGES_BUCKET, AVATARS_BUCKET } from "@/lib/constants";

/**
 * Public storage URL for an object path.
 *
 * Built by hand rather than through `storage.getPublicUrl()` so Server
 * Components can render an image without instantiating a Supabase client.
 */
export function publicUrl(bucket: string, path: string): string {
  return `${env.supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

export function listingImageUrl(path: string | null | undefined): string | null {
  return path ? publicUrl(LISTING_IMAGES_BUCKET, path) : null;
}

export function avatarUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  // Avatars from an OAuth provider arrive as absolute URLs.
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return publicUrl(AVATARS_BUCKET, path);
}

/** Storage keys are `{user_id}/{name}` — the prefix is what the RLS policy checks. */
export function objectPath(userId: string, fileName: string): string {
  const safe = fileName
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(-60);
  return `${userId}/${Date.now()}-${safe}`;
}

export const MAX_LISTING_IMAGES = 6;
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
