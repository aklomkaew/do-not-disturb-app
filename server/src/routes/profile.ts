import { Router } from 'express';

export const profileRouter = Router();

profileRouter.get('/me', (_req, res) => {
  res.status(501).json({ message: 'Profile lookup not implemented yet' });
});

profileRouter.post('/', (_req, res) => {
  res.status(501).json({ message: 'Profile creation not implemented yet' });
});

profileRouter.patch('/', (_req, res) => {
  res.status(501).json({ message: 'Profile update not implemented yet' });
});

profileRouter.get('/', (_req, res) => {
  res.status(501).json({ message: 'Profile catalog not implemented yet' });
});
