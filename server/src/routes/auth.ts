import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../services/prisma';
import { issueVerificationCode, verifyCode } from '../services/verification';
import { VerificationChannel } from '@prisma/client';
import { maskEmail, maskPhoneNumber, normalizePhoneNumber } from '../utils/phone';
import { createAccessToken, createRefreshToken, verifyRefreshToken } from '../services/token';
import { env } from '../config/env';

export const authRouter = Router();

const requestCodeSchema = z.discriminatedUnion('method', [
  z.object({
    method: z.literal('email'),
    email: z.string().email(),
  }),
  z.object({
    method: z.literal('phone'),
    phoneNumber: z.string().min(4, 'Phone number is required'),
  }),
]);

const verifyCodeSchema = z.discriminatedUnion('method', [
  z.object({
    method: z.literal('email'),
    email: z.string().email(),
    code: z.string().regex(/^\d{6}$/, 'Verification code must be 6 digits'),
  }),
  z.object({
    method: z.literal('phone'),
    phoneNumber: z.string().min(4),
    code: z.string().regex(/^\d{6}$/, 'Verification code must be 6 digits'),
  }),
]);

const refreshSchema = z.object({
  refreshToken: z.string().min(20, 'Refresh token is required'),
});

authRouter.post('/request-code', async (req, res, next) => {
  try {
    const payload = requestCodeSchema.parse(req.body);
    const { identifier, channel } = prepareIdentifier(payload);

    let user = await findUserByIdentifier(channel, identifier);
    if (!user) {
      user = await prisma.user.create({
        data: channel === VerificationChannel.EMAIL ? { email: identifier } : { phoneNumber: identifier },
      });
    }

    const { code, expiresAt } = await issueVerificationCode({
      userId: user.id,
      identifier,
      channel,
    });

    res.json({
      message: 'Verification code sent',
      method: payload.method,
      target: channel === VerificationChannel.EMAIL ? maskEmail(identifier) : maskPhoneNumber(identifier),
      expiresInSeconds: Math.ceil((expiresAt.getTime() - Date.now()) / 1000),
      ...(env.NODE_ENV !== 'production' ? { testCode: code } : {}),
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/verify-code', async (req, res, next) => {
  try {
    const payload = verifyCodeSchema.parse(req.body);
    const { identifier, channel } = prepareIdentifier(payload);

    const user = await findUserByIdentifier(channel, identifier);
    if (!user) {
      throw Object.assign(new Error('Account not found. Request a new code.'), { status: 404 });
    }

    await verifyCode({
      userId: user.id,
      channel,
      identifier,
      code: payload.code,
    });

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const { token: accessToken, expiresInSeconds: accessTokenExpiresIn } = createAccessToken(updatedUser.id);
    const { token: refreshToken, expiresInSeconds: refreshTokenExpiresIn } = createRefreshToken(updatedUser.id);

    res.json({
      user: serializeUser(updatedUser),
      accessToken,
      refreshToken,
      accessTokenExpiresIn,
      refreshTokenExpiresIn,
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    const userId = verifyRefreshToken(refreshToken);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw Object.assign(new Error('User not found'), { status: 404 });
    }

    const { token: accessToken, expiresInSeconds: accessTokenExpiresIn } = createAccessToken(user.id);
    const { token: nextRefreshToken, expiresInSeconds: refreshTokenExpiresIn } = createRefreshToken(user.id);

    res.json({
      user: serializeUser(user),
      accessToken,
      refreshToken: nextRefreshToken,
      accessTokenExpiresIn,
      refreshTokenExpiresIn,
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/logout', (_req, res) => {
  res.json({ message: 'Logged out' });
});

function prepareIdentifier(
  payload: z.infer<typeof requestCodeSchema> | z.infer<typeof verifyCodeSchema>
): { identifier: string; channel: VerificationChannel } {
  if (payload.method === 'email') {
    return {
      identifier: payload.email.trim().toLowerCase(),
      channel: VerificationChannel.EMAIL,
    };
  }

  return {
    identifier: normalizePhoneNumber(payload.phoneNumber),
    channel: VerificationChannel.PHONE,
  };
}

async function findUserByIdentifier(channel: VerificationChannel, identifier: string) {
  if (channel === VerificationChannel.EMAIL) {
    return prisma.user.findUnique({ where: { email: identifier } });
  }
  return prisma.user.findUnique({ where: { phoneNumber: identifier } });
}

function serializeUser(user: { id: string; email: string | null; phoneNumber: string | null; role: string; allowlisted: boolean }) {
  return {
    id: user.id,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    allowlisted: user.allowlisted,
  };
}
