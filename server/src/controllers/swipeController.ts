import type { Request, Response } from 'express';
import { SwipeDirection } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../services/prisma';

const swipeSchema = z.object({
  targetProfileId: z.string(),
  direction: z.nativeEnum(SwipeDirection),
  deckSeed: z.string().optional(),
  position: z.number().optional(),
});

const undoSchema = z.object({
  swipeId: z.string(),
});

export async function createSwipe(req: Request, res: Response) {
  const userProfile = req.currentUser?.profile;
  if (!req.currentUser || !userProfile) {
    return res.status(400).json({ message: 'Profile required to swipe' });
  }

  const payload = swipeSchema.parse(req.body);

  if (payload.targetProfileId === userProfile.id) {
    return res.status(409).json({ message: 'Cannot swipe your own profile' });
  }

  const target = await prisma.profile.findUnique({ where: { id: payload.targetProfileId } });
  if (!target) {
    return res.status(404).json({ message: 'Target profile not found' });
  }

  const previous = await prisma.swipe.findUnique({
    where: {
      sourceProfileId_targetProfileId: {
        sourceProfileId: userProfile.id,
        targetProfileId: payload.targetProfileId,
      },
    },
  });

  if (previous) {
    return res.status(409).json({ message: 'Already swiped this profile' });
  }

  const swipe = await prisma.swipe.create({
    data: {
      sourceProfileId: userProfile.id,
      targetProfileId: payload.targetProfileId,
      direction: payload.direction,
      deckSeed: payload.deckSeed,
      position: payload.position,
    },
  });

  let match = null;
  if (payload.direction === SwipeDirection.RIGHT) {
    const reciprocal = await prisma.swipe.findUnique({
      where: {
        sourceProfileId_targetProfileId: {
          sourceProfileId: payload.targetProfileId,
          targetProfileId: userProfile.id,
        },
      },
    });

    if (reciprocal && reciprocal.direction === SwipeDirection.RIGHT) {
      const [profileAId, profileBId] = [userProfile.id, payload.targetProfileId].sort();
      match = await prisma.match.upsert({
        where: {
          profileAId_profileBId: {
            profileAId,
            profileBId,
          },
        },
        update: { lastInteractionAt: new Date() },
        create: {
          profileAId,
          profileBId,
        },
        include: {
          profileA: true,
          profileB: true,
        },
      });
    }
  }

  res.status(match ? 201 : 200).json({ swipe, match });
}

export async function undoSwipe(req: Request, res: Response) {
  const userProfile = req.currentUser?.profile;
  if (!userProfile) {
    return res.status(400).json({ message: 'Profile required' });
  }

  const params = undoSchema.parse({ swipeId: req.params.swipeId });

  const swipe = await prisma.swipe.findUnique({ where: { id: params.swipeId } });
  if (!swipe || swipe.sourceProfileId !== userProfile.id) {
    return res.status(404).json({ message: 'Swipe not found' });
  }

  const tenMinutes = 10 * 60 * 1000;
  if (Date.now() - swipe.createdAt.getTime() > tenMinutes) {
    return res.status(400).json({ message: 'Undo window expired' });
  }

  await prisma.swipe.delete({ where: { id: swipe.id } });

  const [profileAId, profileBId] = [swipe.sourceProfileId, swipe.targetProfileId].sort();
  await prisma.match.deleteMany({
    where: {
      profileAId,
      profileBId,
    },
  });

  res.status(204).send();
}
