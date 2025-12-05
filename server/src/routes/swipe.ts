import { Router } from 'express';

export const swipeRouter = Router();

swipeRouter.post('/', (_req, res) => {
  res.status(501).json({ message: 'Swipe endpoint not implemented yet' });
});

swipeRouter.delete('/:swipeId', (_req, res) => {
  res.status(501).json({ message: 'Swipe undo not implemented yet' });
});
