import { API_BASE_URL } from '@/constants/config';
import * as FileSystem from 'expo-file-system/legacy';

type UploadResponse = {
  uploadUrl: string;
  path: string;
};

type UploadImageParams = {
  assetUri: string;
  accessToken: string | null;
  filename?: string;
};

export async function uploadImage({ assetUri, accessToken, filename }: UploadImageParams): Promise<string> {
  if (!accessToken) {
    throw new Error('Session expired. Please log in again.');
  }

  const safeName = filename ?? assetUri.split('/').pop() ?? 'photo.jpg';

  const signed = await fetch(`${API_BASE_URL}/api/uploads/profile-photo-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ filename: safeName }),
  });

  if (!signed.ok) {
    throw new Error(`Failed to request upload URL (${signed.status})`);
  }

  const data = (await signed.json()) as UploadResponse;

  await FileSystem.uploadAsync(data.uploadUrl, assetUri, {
    httpMethod: 'PUT',
    uploadType: 0, // binary content
    headers: {
      'Content-Type': guessMimeType(safeName),
    },
  });

  return data.path;
}

function guessMimeType(name: string) {
  const lower = name.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}
