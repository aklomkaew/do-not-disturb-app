import { createServer } from 'http';
import { createApp } from './app';
import { env } from './config/env';

async function bootstrap() {
  const app = createApp();
  const server = createServer(app);
  const port = env.PORT ?? 4000;

  server.listen(port, '0.0.0.0', () => {
    // eslint-disable-next-line no-console
    console.log(`Do Not Disturb API listening on port ${port}`);
    const smsReady = env.SMS_PROVIDER === 'twilio' && env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_FROM_NUMBER;
    // eslint-disable-next-line no-console
    console.log(`[auth:sms] ${smsReady ? 'Twilio SMS enabled' : `Mock mode (SMS_PROVIDER=${env.SMS_PROVIDER})`}`);
  });
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server', error);
  process.exit(1);
});
