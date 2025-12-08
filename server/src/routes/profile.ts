import { Gender, RelationshipStatus } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { authGuard } from '../middleware/authGuard';
import { prisma } from '../services/prisma';

export const profileRouter = Router();

profileRouter.use(authGuard);

const profileDetailsSchema = z.object({
  displayName: z.string().min(2, 'Display name is required'),
  age: z.coerce.number().int().min(18).max(100).optional(),
  gender: z.nativeEnum(Gender).optional(),
  relationshipStatus: z.nativeEnum(RelationshipStatus).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(120).optional(),
  matchNotificationsEnabled: z.boolean().optional(),
});

const updateSchema = profileDetailsSchema.partial({
  displayName: true,
});

profileRouter.post('/bootstrap', async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const data = profileDetailsSchema.parse(req.body);

    const existingProfile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      return res.json({ profile: existingProfile, created: false });
    }

    const profile = await prisma.profile.create({
      data: {
        userId,
        displayName: data.displayName,
        gender: data.gender ?? Gender.OTHER,
        age: data.age ?? 21,
        relationshipStatus: data.relationshipStatus ?? RelationshipStatus.SINGLE,
        bio: data.bio ?? 'New to Do Not Disturb. Bio coming soon.',
        location: data.location?.trim() ? data.location.trim() : null,
        matchNotificationsEnabled: data.matchNotificationsEnabled ?? true,
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

profileRouter.patch('/me', async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const data = updateSchema.parse(req.body);
    const { matchNotificationsEnabled, location: locationInput, ...rest } = data;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: 'No profile fields provided' });
    }

    const profile = await prisma.profile.update({
      where: { userId },
      data: {
        ...rest,
        location: locationInput !== undefined ? (locationInput?.trim() ? locationInput.trim() : null) : undefined,
        matchNotificationsEnabled: matchNotificationsEnabled ?? undefined,
      },
    });

    res.json({ profile });
  } catch (error) {
    next(error);
  }
});

profileRouter.get('/', (_req, res) => {
  res.status(501).json({ message: 'Profile catalog not implemented yet' });
});
