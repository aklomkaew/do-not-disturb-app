import { Router } from 'express';
import { adminRouter } from './admin';
import { authRouter } from './auth';
import { matchesRouter } from './matches';
import { profileRouter } from './profile';
import { swipeRouter } from './swipe';
import { authGuard } from '../middleware/authGuard';
import { listProfiles } from '../controllers/profileController';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);

apiRouter.use(authGuard);

apiRouter.use('/profile', profileRouter);
apiRouter.get('/profiles', (req, res, next) => {
  listProfiles(req, res).catch(next);
});
apiRouter.use('/swipes', swipeRouter);
apiRouter.use('/matches', matchesRouter);
apiRouter.use('/admin', adminRouter);
