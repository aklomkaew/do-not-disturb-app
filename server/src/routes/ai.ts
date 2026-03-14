import { Router } from 'express';
import { z } from 'zod';
import { authGuard } from '../middleware/authGuard';
import { rewriteBio } from '../services/ai/bioRewrite';
import { suggestPhotoOrder } from '../services/ai/photoOrdering';
import { assessCompatibility, type ProfileSummary } from '../services/ai/compatibility';
import { prisma } from '../services/prisma';
import { requireProfile } from '../utils/profile';

export const aiRouter = Router();

aiRouter.use(authGuard);

const rewriteBioSchema = z.object({
  bio: z.string().min(1, 'Bio is required').max(2000),
});

const suggestPhotoOrderSchema = z.object({
  photoPaths: z.array(z.string().min(1)).min(2).max(5),
});

aiRouter.post('/rewrite-bio', async (req, res) => {
  try {
    const { bio } = rewriteBioSchema.parse(req.body);
    const suggestions = await rewriteBio(bio);
    res.json({ suggestions });
  } catch (err) {
    const status = (err as { status?: number })?.status ?? 500;
    const message = err instanceof Error ? err.message : 'Failed to get suggestions';
    res.status(status).json({ message });
  }
});

aiRouter.post('/suggest-photo-order', async (req, res) => {
  try {
    const { photoPaths } = suggestPhotoOrderSchema.parse(req.body);
    const orderedPaths = await suggestPhotoOrder(photoPaths);
    res.json({ orderedPaths });
  } catch (err) {
    const status = (err as { status?: number })?.status ?? 500;
    const message = err instanceof Error ? err.message : 'Failed to get photo order';
    res.status(status).json({ message });
  }
});

const compatibilitySchema = z.object({
  partnerProfileId: z.string().min(1, 'Partner profile ID is required'),
});

function toProfileSummary(p: {
  displayName: string;
  age: number;
  gender?: string;
  relationshipStatus?: string;
  bio: string;
  location?: string | null;
  instagramHandle?: string | null;
  preferences?: unknown;
}): ProfileSummary {
  return {
    displayName: p.displayName,
    age: p.age,
    gender: p.gender,
    relationshipStatus: p.relationshipStatus,
    bio: p.bio,
    location: p.location,
    instagramHandle: p.instagramHandle,
    preferences: (p.preferences as { funQuestions?: Record<string, unknown> }) ?? null,
  };
}

aiRouter.post('/compatibility', async (req, res) => {
  try {
    const { partnerProfileId } = compatibilitySchema.parse(req.body);
    const myProfile = await requireProfile(req.user!.id);
    const match = await prisma.match.findFirst({
      where: {
        OR: [
          { profileAId: myProfile.id, profileBId: partnerProfileId },
          { profileAId: partnerProfileId, profileBId: myProfile.id },
        ],
      },
    });
    if (!match) {
      return res.status(403).json({ message: 'You can only check compatibility with someone you have matched with.' });
    }
    const partnerProfile = await prisma.profile.findUnique({
      where: { id: partnerProfileId },
    });
    if (!partnerProfile) {
      return res.status(404).json({ message: 'Profile not found.' });
    }
    const result = await assessCompatibility(
      toProfileSummary(myProfile),
      toProfileSummary(partnerProfile)
    );
    res.json(result);
  } catch (err) {
    const status = (err as { status?: number })?.status ?? 500;
    const message = err instanceof Error ? err.message : 'Failed to assess compatibility';
    res.status(status).json({ message });
  }
});
