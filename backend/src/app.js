import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import { corsOptions } from '#config/cors.js';
import { isDevelopment, isProduction } from '#config/env.js';
import { API_PREFIX } from '#constants/index.js';
import { logger } from '#lib/logger.js';
import { errorHandler, notFoundHandler } from '#middlewares/errorHandler.js';
import routes from '#routes/index.js';

const app = express();

app.set('trust proxy', 1);

app.use(
  pinoHttp({
    logger,
    autoLogging: isDevelopment,
  }),
);

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProduction ? 100 : 2000,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === 'OPTIONS' || req.path.startsWith(`${API_PREFIX}/auth/`),
    message: {
      success: false,
      message: 'Too many requests, please try again later.',
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
      },
    },
  }),
);

app.use(API_PREFIX, routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
