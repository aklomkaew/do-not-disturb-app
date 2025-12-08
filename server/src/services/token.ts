import jwt from 'jsonwebtoken';
import { env } from '../config/env';

type Role = 'USER' | 'ADMIN';

interface TokenPayload {
  sub: string;
  email: string;
  role: Role;
}

const ACCESS_EXPIRES_IN_SECONDS = 60 * 60; // 1 hour
const REFRESH_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 7; // 7 days

export function signAccessToken(payload: TokenPayload) {
  const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: ACCESS_EXPIRES_IN_SECONDS });
  return { token, expiresIn: ACCESS_EXPIRES_IN_SECONDS };
}

export function signRefreshToken(payload: TokenPayload) {
  const token = jwt.sign({ ...payload, type: 'refresh' }, env.JWT_SECRET, {
    expiresIn: REFRESH_EXPIRES_IN_SECONDS,
  });
  return { token, expiresIn: REFRESH_EXPIRES_IN_SECONDS };
}

export function verifyToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload & TokenPayload & { type?: string };
}
