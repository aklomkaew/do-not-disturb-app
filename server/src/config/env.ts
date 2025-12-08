import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const details = parsedEnv.error.issues
    .map((issue) => `${issue.path.join('.') || 'unknown'}: ${issue.message}`)
    .join('\n');

  throw new Error(
    `Environment validation failed. Ensure server/.env exists (see server/.env.example).\n${details}`
  );
}

export const env = parsedEnv.data;
