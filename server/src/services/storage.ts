import { StorageClient } from '@supabase/storage-js';
import { env } from '../config/env';

const storageClient = new StorageClient(`${env.SUPABASE_URL}/storage/v1`, {
  apikey: env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
});

const bucket = env.SUPABASE_BUCKET;

export async function createSignedUpload(path: string) {
  try {
    const { data, error } = await storageClient.from(bucket).createSignedUploadUrl(path);
    if (error || !data) {
      throw Object.assign(new Error(error?.message ?? 'Failed to create upload URL'), { status: 500 });
    }
    return { uploadUrl: data.signedUrl, path };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Storage request failed';
    const cause = err instanceof Error && err.cause ? String(err.cause) : '';
    if (msg === 'fetch failed' || msg.includes('fetch')) {
      throw Object.assign(
        new Error(
          'Photo storage unavailable. Ensure SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY are correct and the "profiles" bucket exists in your Supabase project.' +
            (cause ? ` (${cause})` : '')
        ),
        { status: 503 }
      );
    }
    throw err;
  }
}

export async function signedUrl(path: string, expiresIn = 3600) {
  const { data, error } = await storageClient.from(bucket).createSignedUrl(path, expiresIn);
  if (error || !data?.signedUrl) {
    throw Object.assign(new Error(error?.message ?? 'Failed to create signed URL'), { status: 500 });
  }
  return data.signedUrl;
}

export async function resolvePhotoUrl(value: string): Promise<string> {
  if (!value) return value;
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }
  return signedUrl(value);
}

export function extractPhotoPaths(media: unknown): string[] {
  if (!media || typeof media !== 'object') return [];
  const maybePhotos = (media as { photos?: unknown }).photos;
  if (!Array.isArray(maybePhotos)) return [];
  return maybePhotos.filter((p): p is string => typeof p === 'string' && p.length > 0);
}

export async function resolveMediaPhotos(media: unknown) {
  const photoPaths = extractPhotoPaths(media);
  if (photoPaths.length === 0) {
    return { photoPaths: [], photos: [] as string[] };
  }
  const photos = await Promise.all(photoPaths.map((path) => resolvePhotoUrl(path)));
  return { photoPaths, photos };
}
