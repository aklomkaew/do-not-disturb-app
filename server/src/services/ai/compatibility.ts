import { env } from '../../config/env';

const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

export type ProfileSummary = {
  displayName: string;
  age: number;
  gender?: string;
  relationshipStatus?: string;
  bio: string;
  location?: string | null;
  instagramHandle?: string | null;
  preferences?: {
    funQuestions?: Record<string, unknown>;
  } | null;
};

export type CompatibilityResult = {
  score: number;
  explanation: string;
};

const MAX_BIO_LEN = 300;

function formatProfileForPrompt(p: ProfileSummary, label: string): string {
  const bio = p.bio.length > MAX_BIO_LEN ? p.bio.slice(0, MAX_BIO_LEN) + '…' : p.bio;
  const lines: string[] = [
    `${label}:`,
    `- Name: ${p.displayName}, Age: ${p.age}`,
    `- Gender: ${p.gender ?? 'unknown'}, Relationship status: ${p.relationshipStatus ?? 'unknown'}`,
    `- Bio: ${bio}`,
  ];
  if (p.location) lines.push(`- Location: ${p.location}`);
  const prefs = p.preferences?.funQuestions as Record<string, unknown> | undefined;
  if (prefs && Object.keys(prefs).length > 0) {
    const qEntries = Object.entries(prefs)
      .filter(([, v]) => v != null && v !== '')
      .map(([k, v]) => `  ${k}: ${Array.isArray(v) ? v.join(', ') : v}`);
    if (qEntries.length > 0) lines.push('- Preferences / fun questions:');
    qEntries.forEach((e) => lines.push(e));
  }
  return lines.join('\n');
}

export async function assessCompatibility(
  profileA: ProfileSummary,
  profileB: ProfileSummary
): Promise<CompatibilityResult> {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    throw Object.assign(
      new Error('AI features are disabled. Set GEMINI_API_KEY in server/.env to enable.'),
      { status: 503 }
    );
  }

  const profileAText = formatProfileForPrompt(profileA, 'Person A');
  const profileBText = formatProfileForPrompt(profileB, 'Person B');

  const prompt = `You are a thoughtful dating compatibility expert for a respectful dating app. Assess how well these two people might connect based on their profiles.

${profileAText}

---
${profileBText}

---

Return a JSON object with exactly two keys: "score" (number 1-100) and "explanation" (2-4 concise sentences). Be fair and nuanced; most pairs are 40-80. Keep it warm, specific to their profiles, and avoid generic flattery. Don't mention physical appearance.`;

  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
        responseJsonSchema: {
          type: 'object',
          properties: {
            score: {
              type: 'integer',
              description: 'Compatibility score 1-100',
            },
            explanation: {
              type: 'string',
              description: '2-4 concise sentences explaining why they might connect',
            },
          },
          required: ['score', 'explanation'],
        },
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

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
  const finishReason = data.candidates?.[0]?.finishReason ?? 'UNKNOWN';

  if (process.env.NODE_ENV !== 'test') {
    // eslint-disable-next-line no-console
    console.log('[compatibility] finishReason:', finishReason, '| textLen:', text.length, '| preview:', JSON.stringify(text.slice(0, 120) + (text.length > 120 ? '...' : '')));
  }

  if (!text) {
    throw Object.assign(new Error('AI returned no response.'), { status: 502 });
  }

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? jsonMatch[0] : text;
  let parsed: { score?: number; explanation?: string };

  try {
    parsed = JSON.parse(jsonStr);
  } catch (parseErr) {
    if (finishReason === 'MAX_TOKENS') {
      if (process.env.NODE_ENV !== 'test') {
        // eslint-disable-next-line no-console
        console.warn('[compatibility] MAX_TOKENS + parse failed:', parseErr instanceof Error ? parseErr.message : parseErr, '| raw:', jsonStr.slice(0, 200));
      }
      throw Object.assign(
        new Error('AI response was cut off. Try again.'),
        { status: 502 }
      );
    }
    throw Object.assign(new Error('AI returned invalid response.'), { status: 502 });
  }

  const score = typeof parsed.score === 'number'
    ? Math.round(Math.max(1, Math.min(100, parsed.score)))
    : 70;
  const explanation =
    typeof parsed.explanation === 'string' && parsed.explanation.trim().length > 0
      ? parsed.explanation.trim().slice(0, 500)
      : 'You might connect over shared interests and values.';

  return { score, explanation };
}
