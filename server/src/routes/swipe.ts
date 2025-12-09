import { Router } from 'express';
import { z } from 'zod';
import { Profile, SwipeDirection } from '@prisma/client';
import { authGuard } from '../middleware/authGuard';
import { prisma } from '../services/prisma';
import { requireProfile } from '../utils/profile';
import { sendMatchNotification } from '../services/notifications';
import { resolvePhotoUrl } from '../services/storage';

export const swipeRouter = Router();

swipeRouter.use(authGuard);

const swipeSchema = z.object({
  targetProfileId: z.string().min(1),
  direction: z.nativeEnum(SwipeDirection),
});

swipeRouter.get('/deck', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const profile = await requireProfile(userId);

    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 30);

    const swipedProfiles = await prisma.swipe.findMany({
      where: { sourceProfileId: profile.id, revokedAt: null },
      select: { targetProfileId: true },
    });

    const excludedIds = new Set<string>([profile.id, ...swipedProfiles.map((s) => s.targetProfileId)]);

    const matches = await prisma.match.findMany({
      where: {
        OR: [{ profileAId: profile.id }, { profileBId: profile.id }],
      },
      select: {
        profileAId: true,
        profileBId: true,
      },
    });

    matches.forEach((match) => {
      excludedIds.add(match.profileAId === profile.id ? match.profileBId : match.profileAId);
    });

    const candidates = await prisma.profile.findMany({
      where: {
        id: {
          notIn: Array.from(excludedIds),
        },
      },
      take: limit,
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        displayName: true,
        bio: true,
        age: true,
        location: true,
        media: true,
      },
    });

    const profiles = await Promise.all(candidates.map(serializeProfileCard));

    res.json({
      profiles,
    });
  } catch (error) {
    next(error);
  }
});

swipeRouter.post('/', async (req, res, next) => {
  try {
    const payload = swipeSchema.parse(req.body);
    const userId = req.user!.id;
    const profile = (await requireProfile(userId, { includeUser: true })) as ProfileWithUser;

    if (profile.id === payload.targetProfileId) {
      throw Object.assign(new Error('You cannot swipe on your own profile'), { status: 400 });
    }

    const targetProfile = (await prisma.profile.findUnique({
      where: { id: payload.targetProfileId },
      include: { user: true },
    })) as ProfileWithUser | null;

    if (!targetProfile) {
      throw Object.assign(new Error('Target profile not found'), { status: 404 });
    }

    const swipe = await prisma.swipe.create({
      data: {
        sourceProfileId: profile.id,
        targetProfileId: payload.targetProfileId,
        direction: payload.direction,
      },
    });

    let matchCreated = null;

    if (payload.direction === 'RIGHT') {
      matchCreated = await handlePotentialMatch(profile, targetProfile);
    }

    res.status(201).json({
      swipe,
      match: matchCreated,
    });
  } catch (error) {
    next(error);
  }
});

swipeRouter.post('/rewind', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const profile = await requireProfile(userId);

    const lastSwipe = await prisma.swipe.findFirst({
      where: {
        sourceProfileId: profile.id,
        revokedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!lastSwipe) {
      throw Object.assign(new Error('No swipes to rewind'), { status: 404 });
    }

    await prisma.swipe.update({
      where: { id: lastSwipe.id },
      data: { revokedAt: new Date() },
    });

    if (lastSwipe.direction === 'RIGHT') {
      const [profileAId, profileBId] = canonicalPair(profile.id, lastSwipe.targetProfileId);

      await prisma.match.deleteMany({
        where: { profileAId, profileBId },
      });
    }

    res.json({ rewind: lastSwipe.id });
  } catch (error) {
    next(error);
  }
});

async function serializeProfileCard(profile: {
  id: string;
  displayName: string;
  bio: string;
  age: number;
  location: string | null;
  media: unknown;
}) {
  const photos = await extractPhotos(profile.media);

  return {
    id: profile.id,
    displayName: profile.displayName,
    bio: profile.bio,
    age: profile.age,
    location: profile.location,
    photos,
  };
}

type ProfileWithUser = Profile & {
  user: {
    email: string | null;
    phoneNumber: string | null;
  };
};

async function handlePotentialMatch(profile: ProfileWithUser, targetProfile: ProfileWithUser) {
  const reciprocal = await prisma.swipe.findFirst({
    where: {
      sourceProfileId: targetProfile.id,
      targetProfileId: profile.id,
      direction: 'RIGHT',
      revokedAt: null,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!reciprocal) {
    return null;
  }

  const [profileAId, profileBId] = canonicalPair(profile.id, targetProfile.id);

  const match = await prisma.match.upsert({
    where: {
      profileAId_profileBId: {
        profileAId,
        profileBId,
      },
    },
    update: {
      lastInteractionAt: new Date(),
    },
    create: {
      profileAId,
      profileBId,
    },
    include: {
      profileA: {
        include: { user: true },
      },
      profileB: {
        include: { user: true },
      },
    },
  });

  await notifyParticipants(match);

  return match;
}

function canonicalPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

async function notifyParticipants(match: {
  profileA: ProfileWithUser & { matchNotificationsEnabled: boolean };
  profileB: ProfileWithUser & { matchNotificationsEnabled: boolean };
}) {
  const { profileA, profileB } = match;

  if (profileA.matchNotificationsEnabled) {
    await sendMatchNotification(
      { displayName: profileA.displayName, email: profileA.user.email, phoneNumber: profileA.user.phoneNumber },
      profileB.displayName
    );
  }

  if (profileB.matchNotificationsEnabled) {
    await sendMatchNotification(
      { displayName: profileB.displayName, email: profileB.user.email, phoneNumber: profileB.user.phoneNumber },
      profileA.displayName
    );
  }
}

async function extractPhotos(media: unknown): Promise<string[]> {
  if (!media || typeof media !== 'object') return [];
  const maybePhotos = (media as { photos?: unknown }).photos;
  if (!Array.isArray(maybePhotos)) return [];
  const urls = maybePhotos.filter((p): p is string => typeof p === 'string');
  return Promise.all(urls.map((p) => resolvePhotoUrl(p)));
}
