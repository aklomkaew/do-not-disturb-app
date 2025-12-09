import { StorageClient } from '@supabase/storage-js';
import { env } from '../config/env';

const storageClient = new StorageClient(`${env.SUPABASE_URL}/storage/v1`, {
  apikey: env.SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
});

const bucket = env.SUPABASE_BUCKET;

export async function createSignedUpload(path: string) {
  const { data, error } = await storageClient.from(bucket).createSignedUploadUrl(path);
  if (error || !data) {
    throw Object.assign(new Error(error?.message ?? 'Failed to create upload URL'), { status: 500 });
  }
  return { uploadUrl: data.signedUrl, path };
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
