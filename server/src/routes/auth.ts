import { Router } from 'express';
import { loginController, logoutController, refreshController } from '../controllers/authController';

export const authRouter = Router();

authRouter.post('/login', (req, res, next) => {
  loginController(req, res).catch(next);
});

authRouter.post('/refresh', (req, res, next) => {
  refreshController(req, res).catch(next);
});

authRouter.post('/logout', (req, res) => {
  logoutController(req, res);
});
