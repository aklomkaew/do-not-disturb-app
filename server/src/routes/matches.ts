import { Router } from 'express';
import { authGuard } from '../middleware/authGuard';
import { prisma } from '../services/prisma';
import { requireProfile } from '../utils/profile';
import { resolveMediaPhotos } from '../services/storage';

export const matchesRouter = Router();

matchesRouter.use(authGuard);

matchesRouter.get('/', async (req, res, next) => {
  try {
    const profile = await requireProfile(req.user!.id);

    const matches = await prisma.match.findMany({
      where: {
        OR: [{ profileAId: profile.id }, { profileBId: profile.id }],
      },
      orderBy: {
        lastInteractionAt: 'desc',
      },
      include: {
        profileA: true,
        profileB: true,
      },
    });

    const serialized = await Promise.all(
      matches.map(async (match) => {
        const isA = match.profileAId === profile.id;
        const partner = isA ? match.profileB : match.profileA;
        let photos: string[] = [];
        let photoPaths: string[] = [];
        try {
          const resolved = await resolveMediaPhotos(partner.media);
          photos = resolved.photos;
          photoPaths = resolved.photoPaths;
        } catch (err) {
          console.warn('[matches] Storage signed URL failed for partner:', err instanceof Error ? err.message : err);
        }

        return {
          id: match.id,
          createdAt: match.createdAt,
          lastInteractionAt: match.lastInteractionAt,
          partner: {
            id: partner.id,
            displayName: partner.displayName,
            age: partner.age,
            gender: partner.gender,
            relationshipStatus: partner.relationshipStatus,
            location: partner.location,
            bio: partner.bio,
            instagramHandle: partner.instagramHandle,
            preferences: partner.preferences,
            photos,
            photoPaths,
          },
        };
      })
    );

    res.json({ matches: serialized });
  } catch (error) {
    next(error);
  }
});

