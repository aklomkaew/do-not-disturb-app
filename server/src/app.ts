import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { apiRouter } from './routes/api';
import { healthRouter } from './routes/health';
import { errorHandler } from './middleware/errorHandler';
import { env } from './config/env';

export function createApp() {
  const app = express();

  app.use(helmet());

  const corsOrigin = env.CORS_ORIGIN
    ? env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : undefined;
  app.use(cors(corsOrigin ? { origin: corsOrigin } : {}));

  if (env.NODE_ENV === 'production') {
    app.use(
      rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 200,
        message: { message: 'Too many requests. Please try again later.' },
      })
    );
  }

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
