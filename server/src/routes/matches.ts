import { Router } from 'express';
import { getMatch, inbox, listMatchMessages, listMatches, sendMatchMessage } from '../controllers/matchController';

export const matchesRouter = Router();

matchesRouter.get('/inbox', (req, res, next) => {
  inbox(req, res).catch(next);
});

matchesRouter.get('/', (req, res, next) => {
  listMatches(req, res).catch(next);
});

matchesRouter.get('/:matchId', (req, res, next) => {
  getMatch(req, res).catch(next);
});

matchesRouter.get('/:matchId/messages', (req, res, next) => {
  listMatchMessages(req, res).catch(next);
});

matchesRouter.post('/:matchId/messages', (req, res, next) => {
  sendMatchMessage(req, res).catch(next);
});
