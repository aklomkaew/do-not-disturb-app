import crypto from 'crypto';
import { prisma } from './prisma';

export async function storeRefreshToken(userId: string, token: string, expiresAt: Date) {
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt,
    },
  });
}

export async function ensureActiveRefreshToken(token: string) {
  const tokenHash = hashToken(token);
  const record = await prisma.refreshToken.findUnique({
    where: { tokenHash },
  });

  if (!record || record.revokedAt || record.expiresAt <= new Date()) {
    throw Object.assign(new Error('Refresh token is no longer valid'), { status: 401 });
  }

  return record;
}

export async function revokeRefreshToken(token: string) {
  const tokenHash = hashToken(token);
  await prisma.refreshToken.updateMany({
    where: {
      tokenHash,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}
