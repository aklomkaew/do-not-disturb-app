import type * as ImagePicker from 'expo-image-picker';

export type PhotoEntry = {
  path: string;
  url: string;
};

const SUPPORTED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

export function hydratePhotoEntries(paths?: string[], urls?: string[]): PhotoEntry[] {
  const safePaths = paths ?? [];
  const safeUrls = urls ?? [];

  if (safePaths.length === 0 && safeUrls.length > 0) {
    return safeUrls.map((url) => ({ path: url, url }));
  }

  return safePaths.map((path, index) => ({
    path,
    url: safeUrls[index] ?? path,
  }));
}

export function mergePhotoEntries(current: PhotoEntry[], additions: PhotoEntry[], limit = 5): PhotoEntry[] {
  const seen = new Set<string>();
  const merged: PhotoEntry[] = [];

  for (const entry of [...current, ...additions]) {
    if (!entry.path) continue;
    if (seen.has(entry.path)) continue;
    seen.add(entry.path);
    merged.push({
      path: entry.path,
      url: entry.url ?? entry.path,
    });
    if (merged.length === limit) break;
  }

  return merged;
}

export function partitionSupportedAssets(assets: ImagePicker.ImagePickerAsset[]) {
  const supported: ImagePicker.ImagePickerAsset[] = [];
  const rejected: ImagePicker.ImagePickerAsset[] = [];

  assets.forEach((asset) => {
    if (isSupportedAsset(asset)) {
      supported.push(asset);
    } else {
      rejected.push(asset);
    }
  });

  return { supported, rejected };
}

function isSupportedAsset(asset: ImagePicker.ImagePickerAsset) {
  if (!asset) return false;
  if (asset.type && asset.type !== 'image') return false;

  const mime = asset.mimeType?.toLowerCase();
  if (mime && SUPPORTED_MIME_TYPES.has(mime)) {
    return true;
  }

  const name = getAssetName(asset);
  if (!name) return false;
  const lowerName = name.toLowerCase();
  return SUPPORTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
}

function getAssetName(asset: ImagePicker.ImagePickerAsset) {
  if (asset.fileName) return asset.fileName;
  if (asset.uri) {
    const withoutQuery = asset.uri.split('?')[0];
    return withoutQuery.split('/').pop() ?? null;
  }
  return null;
}
