import { Router } from 'express';
import { z } from 'zod';
import { authGuard } from '../middleware/authGuard';
import { createSignedUpload } from '../services/storage';
import crypto from 'crypto';

export const uploadsRouter = Router();

uploadsRouter.use(authGuard);

const payloadSchema = z.object({
  filename: z.string().min(1),
});

uploadsRouter.post('/profile-photo-url', async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { filename } = payloadSchema.parse(req.body);
    const ext = filename.includes('.') ? filename.split('.').pop() : 'jpg';
    const safeExt = ext?.replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
    const uniqueName = `${Date.now()}-${crypto.randomUUID()}.${safeExt}`;
    const path = `${userId}/${uniqueName}`;

    const { uploadUrl } = await createSignedUpload(path);

    res.json({ uploadUrl, path });
  } catch (error) {
    next(error);
  }
});
