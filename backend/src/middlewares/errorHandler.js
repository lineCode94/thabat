import { HTTP_STATUS } from '#constants/index.js';
import { logger } from '#lib/logger.js';
import { ApiError } from '#utils/apiError.js';

export function notFoundHandler(_req, _res, next) {
  next(ApiError.notFound('Route not found'));
}

export function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = err.isOperational ? err.message : 'Internal server error';
  const code = err.isOperational ? err.code : 'INTERNAL_ERROR';

  if (!err.isOperational) {
    logger.error({ err }, 'Unhandled error');
  }

  const payload = {
    success: false,
    message,
    error: {
      code,
    },
  };

  if (err.details?.length) {
    payload.error.details = err.details;
  }

  res.status(statusCode).json(payload);
}
