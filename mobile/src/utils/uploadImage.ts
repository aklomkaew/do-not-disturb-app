import { API_BASE_URL } from '@/constants/config';
import { File } from 'expo-file-system';

type UploadResponse = {
  uploadUrl: string;
  path: string;
};

type UploadResult = {
  path: string;
  previewUrl: string;
};

type UploadImageParams = {
  assetUri: string;
  accessToken: string | null;
  filename?: string;
};

export async function uploadImage({ assetUri, accessToken, filename }: UploadImageParams): Promise<UploadResult> {
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
  const mimeType = guessMimeType(safeName);
  const body = await resolveUploadBody(assetUri);

  const uploadResponse = await fetch(data.uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': mimeType,
    },
    body,
  });

  if (!uploadResponse.ok) {
    throw new Error(`Failed to upload image (${uploadResponse.status})`);
  }

  const previewUrl = await requestPhotoPreview(data.path, accessToken);
  return { path: data.path, previewUrl };
}

function guessMimeType(name: string) {
  const lower = name.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

async function resolveUploadBody(uri: string): Promise<Blob> {
  if (uri.startsWith('file://') || uri.startsWith('content://')) {
    const file = new File(uri);
    if (!file.exists) {
      throw new Error('Selected file could not be found on device.');
    }
    return file;
  }

  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error('Unable to read selected file.');
  }

  const blob = await response.blob();
  if (!blob || blob.size === 0) {
    throw new Error('Selected file is empty.');
  }
  return blob;
}

async function requestPhotoPreview(path: string, accessToken: string) {
  const response = await fetch(`${API_BASE_URL}/api/uploads/profile-photo-preview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ path }),
  });

  if (!response.ok) {
    throw new Error(await extractError(response));
  }

  const data = (await response.json()) as { url: string };
  return data.url;
}

async function extractError(response: Response) {
  try {
    const data = await response.json();
    return data?.message ?? data?.error?.message ?? 'Upload failed';
  } catch {
    return response.statusText || 'Upload failed';
  }
}
