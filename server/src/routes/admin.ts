import { Router } from 'express';

export const adminRouter = Router();

adminRouter.get('/profiles', (_req, res) => {
  res.status(501).json({ message: 'Admin profiles query not implemented yet' });
});

adminRouter.delete('/profiles/:profileId', (_req, res) => {
  res.status(501).json({ message: 'Admin profile removal not implemented yet' });
});

adminRouter.post('/profiles/:profileId/moderate', (_req, res) => {
  res.status(501).json({ message: 'Admin moderation action not implemented yet' });
});

adminRouter.get('/metrics/dau', (_req, res) => {
  res.status(501).json({ message: 'Admin DAU metrics not implemented yet' });
});

adminRouter.get('/stats', (_req, res) => {
  res.status(501).json({ message: 'Admin aggregate stats not implemented yet' });
});
