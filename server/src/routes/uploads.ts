import { Router } from 'express';
import { z } from 'zod';
import { authGuard } from '../middleware/authGuard';
import { createSignedUpload, resolvePhotoUrl } from '../services/storage';
import crypto from 'crypto';

export const uploadsRouter = Router();

uploadsRouter.use(authGuard);

const payloadSchema = z.object({
  filename: z.string().min(1),
});

const previewSchema = z.object({
  path: z.string().min(1),
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
    const status = (error as { status?: number })?.status ?? 500;
    const msg = error instanceof Error ? error.message : 'Upload failed';
    const message = msg.includes('storage') || msg.includes('Supabase')
      ? 'Photo storage is not configured. Set up Supabase storage to upload photos.'
      : msg;
    res.status(status).json({ message });
  }
});

uploadsRouter.post('/profile-photo-preview', async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { path } = previewSchema.parse(req.body);
    if (!path.startsWith(`${userId}/`)) {
      return res.status(403).json({ message: 'Cannot preview another user\'s media' });
    }

    const url = await resolvePhotoUrl(path);
    res.json({ url });
  } catch (error) {
    next(error);
  }
});
