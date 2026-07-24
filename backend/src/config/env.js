import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Cloud platforms (Render, Railway, Fly.io, etc.) usually provide PORT.
  PORT: z.coerce.number().optional(),

  // Backward compatibility with existing environments.
  SERVER_PORT: z.coerce.number().optional(),

  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  JWT_EXPIRES: z.string().default('15m'),
  REFRESH_SECRET: z.string().min(1),

  EMAIL_HOST: z.string().default(''),
  EMAIL_PORT: z.coerce.number().default(587),
  EMAIL_USER: z.string().default(''),
  EMAIL_PASSWORD: z.string().default(''),

  CLIENT_URL: z.string().url(),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  SEED_ADMIN_EMAIL: z.string().email().optional(),
  SEED_ADMIN_PASSWORD: z.string().min(12).optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  SERVER_PORT: parsed.data.PORT ?? parsed.data.SERVER_PORT ?? 5000,
};

export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
