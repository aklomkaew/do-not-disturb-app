import { resolvePhotoUrl } from '../storage';
import { env } from '../../config/env';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

/** Fetches image from URL and returns base64 for Gemini. */
async function fetchImageAsBase64(url: string): Promise<{ mimeType: string; data: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
  const buf = await res.arrayBuffer();
  const base64 = Buffer.from(buf).toString('base64');
  const contentType = res.headers.get('content-type') || 'image/jpeg';
  const mimeType = contentType.split(';')[0].trim();
  return { mimeType, data: base64 };
}

export async function suggestPhotoOrder(photoPaths: string[]): Promise<string[]> {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    throw Object.assign(
      new Error('AI features are disabled. Set GEMINI_API_KEY in server/.env to enable.'),
      { status: 503 }
    );
  }

  if (photoPaths.length < 2) {
    return [...photoPaths];
  }

  const imageParts: Array<{ inline_data: { mime_type: string; data: string } }> = [];
  for (const path of photoPaths) {
    const url = await resolvePhotoUrl(path);
    const { mimeType, data } = await fetchImageAsBase64(url);
    imageParts.push({ inline_data: { mime_type: mimeType, data } });
  }

  const prompt = `You are helping order profile photos for a dating app. The user has uploaded ${photoPaths.length} photos (in order: 0, 1, 2, ...).

Rank these photos from best to worst for a dating profile. Consider:
- First photo (profile picture) should be the most flattering, clear, and engaging
- Good lighting and composition
- Face clearly visible in at least the first photo
- Authentic and appealing

Return ONLY a JSON array of indices (0-based) in the recommended order. For example, if you suggest photo 2 first, then photo 0, then photo 1, respond with: [2,0,1]

No other text. Only the JSON array.`;

  const parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }> = [
    { text: prompt },
  ];
  for (const img of imageParts) {
    parts.push({ inline_data: img.inline_data });
  }

  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 256,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw Object.assign(
      new Error(`AI service error: ${response.status}. ${errText.slice(0, 200)}`),
      { status: 502 }
    );
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
  if (!text) {
    return [...photoPaths];
  }

  try {
    const match = text.match(/\[[\d,\s]*\]/);
    const arr = match ? JSON.parse(match[0]) : [];
    if (!Array.isArray(arr) || arr.length !== photoPaths.length) {
      return [...photoPaths];
    }
    const seen = new Set<number>();
    for (const i of arr) {
      if (typeof i !== 'number' || i < 0 || i >= photoPaths.length || seen.has(i)) {
        return [...photoPaths];
      }
      seen.add(i);
    }
    return arr.map((i: number) => photoPaths[i]);
  } catch {
    return [...photoPaths];
  }
}
