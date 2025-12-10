export type PhotoEntry = {
  path: string;
  url: string;
};

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
