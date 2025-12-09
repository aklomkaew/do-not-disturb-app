import { Router } from 'express';
import { authGuard } from '../middleware/authGuard';
import { prisma } from '../services/prisma';
import { requireProfile } from '../utils/profile';
import { resolvePhotoUrl } from '../services/storage';

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

    const serialized = await Promise.all(matches.map(async (match) => {
      const isA = match.profileAId === profile.id;
      const partner = isA ? match.profileB : match.profileA;
      const photos = await extractPhotos(partner.media);

      return {
        id: match.id,
        createdAt: match.createdAt,
        lastInteractionAt: match.lastInteractionAt,
        partner: {
          id: partner.id,
          displayName: partner.displayName,
          age: partner.age,
          location: partner.location,
          bio: partner.bio,
          photos,
        },
      };
    }));

    res.json({ matches: serialized });
  } catch (error) {
    next(error);
  }
});

async function extractPhotos(media: unknown): Promise<string[]> {
  if (!media || typeof media !== 'object') return [];
  const maybePhotos = (media as { photos?: unknown }).photos;
  if (!Array.isArray(maybePhotos)) return [];
  const urls = maybePhotos.filter((p): p is string => typeof p === 'string');
  return Promise.all(urls.map((p) => resolvePhotoUrl(p)));
}
