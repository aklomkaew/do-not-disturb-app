import { Router } from 'express';
import { createSwipe, undoSwipe } from '../controllers/swipeController';

export const swipeRouter = Router();

swipeRouter.post('/', (req, res, next) => {
  createSwipe(req, res).catch(next);
});

swipeRouter.delete('/:swipeId', (req, res, next) => {
  undoSwipe(req, res).catch(next);
});
