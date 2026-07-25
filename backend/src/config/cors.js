import { env } from '#config/env.js';

const DEV_CLIENT_ORIGIN_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1):517\d$/;
const NGROK_ORIGIN_PATTERN = /^https:\/\/[a-z0-9-]+\.ngrok-free\.(app|dev)$/;
const VERCEL_PREVIEW_PATTERN = /^https:\/\/[a-z0-9-]+\.vercel\.app$/;

const ALLOWED_ORIGINS = [env.CLIENT_URL, 'https://thabat-frontend-wavk.vercel.app'].filter(Boolean);

function isAllowedOrigin(origin) {
  // Postman أو server-to-server requests
  if (!origin) return true;

  if (ALLOWED_ORIGINS.includes(origin)) {
    return true;
  }

  if (VERCEL_PREVIEW_PATTERN.test(origin)) {
    return true;
  }

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

    console.error('Blocked CORS Origin:', origin);

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204,
};
