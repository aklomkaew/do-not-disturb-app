import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { apiRouter } from './routes/api';
import { healthRouter } from './routes/health';
import { errorHandler } from './middleware/errorHandler';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.get('/', (_req, res) => {
    res.json({ name: 'Do Not Disturb API', version: '0.1.0' });
  });

  app.use('/health', healthRouter);
  app.use('/api', apiRouter);

  app.use((_req, res) => {
    res.status(404).json({ message: 'Route not found' });
  });

  app.use(errorHandler);

  return app;
}
