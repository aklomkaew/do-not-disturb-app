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
  VERIFICATION_REQUEST_LIMIT: z.coerce.number().int().positive().default(5),
  VERIFICATION_REQUEST_WINDOW_SECONDS: z.coerce.number().int().positive().default(900),
  SMS_PROVIDER: z.enum(['mock', 'twilio']).default('mock'),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM_NUMBER: z.string().optional(),
  EMAIL_PROVIDER: z.enum(['mock', 'resend']).default('mock'),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM_ADDRESS: z.string().email().optional(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_BUCKET: z.string().min(1),
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
