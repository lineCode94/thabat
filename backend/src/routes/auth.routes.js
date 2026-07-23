import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import { isProduction } from '#config/env.js';
import { AuthController } from '#controllers/auth.controller.js';
import { asyncHandler } from '#helpers/asyncHandler.js';
import { authenticate } from '#middlewares/auth.middleware.js';
import { validateRequest } from '#middlewares/validateRequest.js';
import { registerSchema, loginSchema } from '#validators/auth.validator.js';

const router = Router();
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 20 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.',
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
    },
  },
});

router.post('/register', authLimiter, validateRequest(registerSchema), asyncHandler(AuthController.register));
router.post('/login', authLimiter, validateRequest(loginSchema), asyncHandler(AuthController.login));
router.get('/me', authenticate, asyncHandler(AuthController.me));

export default router;
