import { Router } from 'express';

export const authRouter = Router();

authRouter.post('/login', (_req, res) => {
  res.status(501).json({ message: 'OAuth login not implemented yet' });
});

authRouter.post('/refresh', (_req, res) => {
  res.status(501).json({ message: 'Token refresh not implemented yet' });
});

authRouter.post('/logout', (_req, res) => {
  res.status(501).json({ message: 'Logout not implemented yet' });
});
