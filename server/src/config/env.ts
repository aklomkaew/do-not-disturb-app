import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(16, 'JWT secret must be at least 16 characters'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT refresh secret must be at least 16 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  VERIFICATION_CODE_TTL_SECONDS: z.coerce.number().int().positive().default(300),
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
