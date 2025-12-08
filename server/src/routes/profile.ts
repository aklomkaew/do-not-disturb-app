import { Router } from 'express';
import { createProfile, getMyProfile, updateProfile } from '../controllers/profileController';

export const profileRouter = Router();

profileRouter.get('/me', (req, res, next) => {
  getMyProfile(req, res).catch(next);
});

profileRouter.post('/', (req, res, next) => {
  createProfile(req, res).catch(next);
});

profileRouter.patch('/', (req, res, next) => {
  updateProfile(req, res).catch(next);
});
