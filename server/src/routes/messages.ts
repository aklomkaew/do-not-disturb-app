import { Router } from 'express';

export const messagesRouter = Router();

messagesRouter.get('/', (_req, res) => {
  res.status(501).json({ message: 'Inbox not implemented yet' });
});
