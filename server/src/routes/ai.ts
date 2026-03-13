import { Router } from 'express';
import { z } from 'zod';
import { authGuard } from '../middleware/authGuard';
import { rewriteBio } from '../services/ai/bioRewrite';
import { suggestPhotoOrder } from '../services/ai/photoOrdering';

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
