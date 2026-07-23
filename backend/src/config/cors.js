import { env } from '#config/env.js';

const DEV_CLIENT_ORIGIN_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1):517\d$/;
const NGROK_ORIGIN_PATTERN = /^https:\/\/[a-z0-9-]+\.ngrok-free\.(app|dev)$/;

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (origin === env.CLIENT_URL) return true;

  if (env.NODE_ENV === 'development') {
    return DEV_CLIENT_ORIGIN_PATTERN.test(origin) || NGROK_ORIGIN_PATTERN.test(origin);
  }

  return false;
}

export const corsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
