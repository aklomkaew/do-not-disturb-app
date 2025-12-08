import { Gender, RelationshipStatus } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { authGuard } from '../middleware/authGuard';
import { prisma } from '../services/prisma';

export const profileRouter = Router();

profileRouter.use(authGuard);

const bootstrapSchema = z.object({
  displayName: z.string().min(2, 'Display name is required'),
});

profileRouter.post('/bootstrap', async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { displayName } = bootstrapSchema.parse(req.body);

    const existingProfile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      return res.json({ profile: existingProfile, created: false });
    }

    const profile = await prisma.profile.create({
      data: {
        userId,
        displayName,
        gender: Gender.OTHER,
        age: 21,
        relationshipStatus: RelationshipStatus.SINGLE,
        bio: 'New to Do Not Disturb. Bio coming soon.',
        media: { photos: [] },
        preferences: {},
      },
    });

    res.status(201).json({ profile, created: true });
  } catch (error) {
    next(error);
  }
});

profileRouter.get('/me', async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const profile = await prisma.profile.findUnique({ where: { userId } });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json({ profile });
  } catch (error) {
    next(error);
  }
});

profileRouter.get('/', (_req, res) => {
  res.status(501).json({ message: 'Profile catalog not implemented yet' });
});
