import { Gender, RelationshipStatus } from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { authGuard } from '../middleware/authGuard';
import { prisma } from '../services/prisma';
import { resolveMediaPhotos } from '../services/storage';

export const profileRouter = Router();

profileRouter.use(authGuard);

const photosSchema = z
  .object({
    photos: z.array(z.string().min(1)).max(5),
  })
  .optional();

const profileDetailsSchema = z.object({
  displayName: z.string().min(2, 'Display name is required'),
  age: z.coerce.number().int().min(18).max(100).optional(),
  gender: z.nativeEnum(Gender).optional(),
  relationshipStatus: z.nativeEnum(RelationshipStatus).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(120).optional(),
  matchNotificationsEnabled: z.boolean().optional(),
  media: photosSchema,
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
    const photos = data.media?.photos ?? [];

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
        media: { photos },
        preferences: {},
      },
    });

    res.status(201).json({ profile: await withSignedPhotos(profile), created: true });
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

    res.json({ profile: await withSignedPhotos(profile) });
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
    const { matchNotificationsEnabled, location: locationInput, media, ...rest } = data;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ message: 'No profile fields provided' });
    }

    const profile = await prisma.profile.update({
      where: { userId },
      data: {
        ...rest,
        location: locationInput !== undefined ? (locationInput?.trim() ? locationInput.trim() : null) : undefined,
        matchNotificationsEnabled: matchNotificationsEnabled ?? undefined,
        media: media ? { photos: media.photos } : undefined,
      },
    });

    res.json({ profile: await withSignedPhotos(profile) });
  } catch (error) {
    next(error);
  }
});

profileRouter.get('/', (_req, res) => {
  res.status(501).json({ message: 'Profile catalog not implemented yet' });
});

profileRouter.delete('/me', async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    await prisma.$transaction(async (tx) => {
      const matches = await tx.match.findMany({
        where: {
          OR: [{ profileAId: profile.id }, { profileBId: profile.id }],
        },
        select: { id: true },
      });

      const matchIds = matches.map((match) => match.id);

      if (matchIds.length > 0) {
        await tx.message.deleteMany({
          where: {
            matchId: { in: matchIds },
          },
        });
      }

      await Promise.all([
        tx.notification.deleteMany({ where: { profileId: profile.id } }),
        tx.swipe.deleteMany({
          where: {
            OR: [{ sourceProfileId: profile.id }, { targetProfileId: profile.id }],
          },
        }),
        tx.match.deleteMany({
          where: {
            OR: [{ profileAId: profile.id }, { profileBId: profile.id }],
          },
        }),
        tx.verificationCode.deleteMany({ where: { userId } }),
        tx.refreshToken.deleteMany({ where: { userId } }),
      ]);

      await tx.profile.delete({ where: { id: profile.id } });
      await tx.user.delete({ where: { id: userId } });
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

async function withSignedPhotos<T extends { media: any }>(profile: T) {
  const { photoPaths, photos } = await resolveMediaPhotos(profile.media);
  return { ...profile, media: { photos, paths: photoPaths } };
}
