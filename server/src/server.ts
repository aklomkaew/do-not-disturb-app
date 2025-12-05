import { createServer } from 'http';
import { createApp } from './app';
import { env } from './config/env';

async function bootstrap() {
  const app = createApp();
  const server = createServer(app);
  const port = env.PORT ?? 4000;

  server.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Do Not Disturb API listening on port ${port}`);
  });
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server', error);
  process.exit(1);
});
