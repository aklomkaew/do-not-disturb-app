import { Router } from 'express';
import { adminRouter } from './admin';
import { authRouter } from './auth';
import { matchesRouter } from './matches';
import { profileRouter } from './profile';
import { swipeRouter } from './swipe';
import { messagesRouter } from './messages';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/profile', profileRouter);
apiRouter.use('/profiles', profileRouter); // temporary reuse for catalog endpoint
apiRouter.use('/swipes', swipeRouter);
apiRouter.use('/matches', matchesRouter);
apiRouter.use('/messages', messagesRouter);
apiRouter.use('/admin', adminRouter);
