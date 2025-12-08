import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../services/prisma';
import { verifyToken } from '../services/token';

export async function authGuard(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header) {
      return res.status(401).json({ message: 'Missing Authorization header' });
    }

    const [, token] = header.split(' ');
    if (!token) {
      return res.status(401).json({ message: 'Invalid Authorization header' });
    }

    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub as string },
      include: { profile: true },
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.currentUser = user;
    next();
  } catch (error) {
    next(error);
  }
}
