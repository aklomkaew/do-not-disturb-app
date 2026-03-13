import { env } from '../../config/env';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export async function rewriteBio(bio: string): Promise<string[]> {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    throw Object.assign(
      new Error('AI features are disabled. Set GEMINI_API_KEY in server/.env to enable.'),
      { status: 503 }
    );
  }

  const prompt = `Improve this dating profile bio. Keep it similar in length and style to the original.

Original:
"${bio}"

Rules:
- Match the original's length and conciseness. If it's short and casual, keep suggestions short. If it's longer, you can match that.
- Include ALL key details from the original: hobbies, interests, what they're looking for, jokes. Don't drop anything important.
- Keep their voice and tone (casual, witty, sincere, etc.). Polish and improve but stay authentic.
- Each suggestion MUST be complete: full sentences, no cut-offs, no unclosed brackets or ellipsis. End with proper punctuation.
- Varied tone: one slightly playful, one more straightforward.
- Optional: add 1–3 emojis where they fit naturally. Keep it casual and easy to read—don’t overdo it.
- Appropriate for a respectful dating app. Max 500 characters per suggestion.

Output: Exactly 2 complete alternatives separated by "---". No labels or preamble.`;

  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 2048,
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
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
      finishReason?: string;
    }>;
  };

  const candidate = data.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text?.trim() ?? '';
  const finishReason = candidate?.finishReason ?? 'UNKNOWN';

  // Debug: log to diagnose incomplete responses (check server console when testing)
  if (process.env.NODE_ENV !== 'test') {
    const parts = text.split(/\n *---+ *\n| *--- *| *— *|\n *—+ *\n/);
    // eslint-disable-next-line no-console
    console.log('[bioRewrite] finishReason:', finishReason, '| len:', text.length, '| splitParts:', parts.length, '| preview:', JSON.stringify(text.slice(0, 80) + (text.length > 80 ? '...' : '')));
  }

  if (finishReason === 'MAX_TOKENS') {
    throw Object.assign(
      new Error('AI response was cut off (token limit). Try a shorter bio or try again.'),
      { status: 502 }
    );
  }

  if (!text) {
    throw Object.assign(new Error('AI returned no suggestions.'), { status: 502 });
  }

  // Split on "---" (newlines optional) or em dash "—"
  const suggestions = text
    .split(/\n *---+ *\n| *--- *| *— *|\n *—+ *\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15)
    .map((s) => truncateToSensibleBoundary(s))
    .filter((s) => looksComplete(s)); // Drop cut-off suggestions

  if (suggestions.length > 0) return suggestions;
  // Fallback: use first segment before "---" or full text, truncated sensibly
  const first = text.split(/---|—/)[0]?.trim();
  const fallback = truncateToSensibleBoundary(first && first.length > 20 ? first : text.trim());
  return [fallback];

}

/** Reject suggestions that clearly look cut off. */
function looksComplete(s: string): boolean {
  const t = s.trim();
  if (t.length < 10) return false;
  if (/[(\[]$/.test(t)) return false; // ends with unclosed "(" or "["
  // Contains "(" but no closing ")" — likely cut off
  const openParens = (t.match(/\(/g) || []).length;
  const closeParens = (t.match(/\)/g) || []).length;
  if (openParens > closeParens) return false;
  // Long text should end with sentence-ending punctuation
  if (t.length > 50 && !/[.!?~)\)]$/.test(t)) return false;
  return true;
}

/** Truncate at a sentence or word boundary so the result still reads naturally. */
function truncateToSensibleBoundary(s: string, maxLen = 500): string {
  if (s.length <= maxLen) return s;

  const slice = s.slice(0, maxLen);
  const minLength = 80; // Don't truncate to less than this

  // 1. Prefer cutting at last sentence boundary (. ! ?) so it reads complete
  for (let i = slice.length - 1; i >= minLength; i--) {
    if (/[.!?]/.test(slice[i])) {
      let cutAt = i + 1;
      while (cutAt < slice.length && /\s/.test(slice[cutAt])) cutAt++;
      return s.slice(0, cutAt).trim();
    }
  }

  // 2. Otherwise cut at last word boundary to avoid mid-word
  const lastSpace = slice.lastIndexOf(' ');
  if (lastSpace >= minLength) {
    return s.slice(0, lastSpace).trim();
  }

  // 3. Fallback: hard cut
  return s.slice(0, maxLen - 1).trim() + '…';
}
