import type { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../services/prisma';
import { signAccessToken, signRefreshToken, verifyToken } from '../services/token';

const loginSchema = z.object({
  email: z.string().email(),
  role: z.enum(['user', 'admin']).default('user'),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

export async function loginController(req: Request, res: Response) {
  const payload = loginSchema.parse(req.body);

  const normalizedRole = payload.role === 'admin' ? 'ADMIN' : 'USER';

  const user = await prisma.user.upsert({
    where: { email: payload.email },
    update: {
      role: normalizedRole,
      lastLoginAt: new Date(),
    },
    create: {
      email: payload.email,
      role: normalizedRole,
      allowlisted: payload.email === 'aklomkaew@gmail.com',
      lastLoginAt: new Date(),
    },
    include: { profile: true },
  });

  const tokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };

  const access = signAccessToken(tokenPayload);
  const refresh = signRefreshToken(tokenPayload);

  res.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role.toLowerCase(),
      allowlisted: user.allowlisted,
    },
    profileStatus: user.profile ? 'complete' : 'needs_profile',
    session: {
      accessToken: access.token,
      refreshToken: refresh.token,
      expiresIn: access.expiresIn,
    },
  });
}

export async function refreshController(req: Request, res: Response) {
  const { refreshToken } = refreshSchema.parse(req.body);
  const payload = verifyToken(refreshToken);

  if (payload.type !== 'refresh') {
    return res.status(400).json({ message: 'Invalid refresh token' });
  }

  const access = signAccessToken({
    sub: payload.sub as string,
    email: payload.email as string,
    role: payload.role as 'USER' | 'ADMIN',
  });

  res.json({
    accessToken: access.token,
    expiresIn: access.expiresIn,
  });
}

export function logoutController(_req: Request, res: Response) {
  // With stateless JWTs we simply respond success; clients should discard tokens.
  res.status(204).send();
}
