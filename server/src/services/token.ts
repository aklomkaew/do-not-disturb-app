import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { ensureActiveRefreshToken, storeRefreshToken } from './session';

const ACCESS_TOKEN_TTL = env.JWT_ACCESS_EXPIRES_IN;
const REFRESH_TOKEN_TTL = env.JWT_REFRESH_EXPIRES_IN;

type TokenPayload = {
  sub: string;
};

export function createAccessToken(userId: string) {
  const expiresInSeconds = parseDurationSeconds(ACCESS_TOKEN_TTL);
  const payload: TokenPayload = { sub: userId };
  const options: SignOptions = { expiresIn: expiresInSeconds };
  const token = jwt.sign(payload, env.JWT_SECRET, options);

  return {
    token,
    expiresInSeconds,
  };
}

export async function createRefreshToken(userId: string) {
  const expiresInSeconds = parseDurationSeconds(REFRESH_TOKEN_TTL);
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
  const payload: TokenPayload = { sub: userId };
  const options: SignOptions = { expiresIn: expiresInSeconds };
  const token = jwt.sign(payload, env.JWT_REFRESH_SECRET, options);

  await storeRefreshToken(userId, token, expiresAt);

  return {
    token,
    expiresInSeconds,
  };
}

export async function verifyRefreshToken(token: string) {
  try {
    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
    const record = await ensureActiveRefreshToken(token);

    if (record.userId !== payload.sub) {
      throw new Error('Refresh token subject mismatch');
    }

    return payload.sub;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid refresh token';
    throw Object.assign(new Error(message), { status: 401 });
  }
}

function parseDurationSeconds(value: string) {
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) {
    throw new Error(`Invalid duration format: ${value}`);
  }

  const amount = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's':
      return amount;
    case 'm':
      return amount * 60;
    case 'h':
      return amount * 60 * 60;
    case 'd':
      return amount * 60 * 60 * 24;
    default:
      throw new Error(`Unsupported duration unit: ${unit}`);
  }
}
