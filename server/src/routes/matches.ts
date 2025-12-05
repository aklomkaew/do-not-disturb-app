import { Router } from 'express';

export const matchesRouter = Router();

matchesRouter.get('/', (_req, res) => {
  res.status(501).json({ message: 'Match listing not implemented yet' });
});

matchesRouter.get('/:matchId', (_req, res) => {
  res.status(501).json({ message: 'Match detail not implemented yet' });
});

matchesRouter.get('/:matchId/messages', (_req, res) => {
  res.status(501).json({ message: 'Match messages not implemented yet' });
});

matchesRouter.post('/:matchId/messages', (_req, res) => {
  res.status(501).json({ message: 'Send message not implemented yet' });
});

matchesRouter.get('/inbox', (_req, res) => {
  res.status(501).json({ message: 'Messages inbox not implemented yet' });
});
