import { HTTP_STATUS } from '#constants/index.js';

export class ApiError extends Error {
  constructor(statusCode, message, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, code = 'BAD_REQUEST', details = null) {
    return new ApiError(HTTP_STATUS.BAD_REQUEST, message, code, details);
  }

  static validation(message = 'Validation failed.', details = []) {
    return new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, message, 'VALIDATION_ERROR', details);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(HTTP_STATUS.UNAUTHORIZED, message, 'UNAUTHORIZED');
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(HTTP_STATUS.FORBIDDEN, message, 'FORBIDDEN');
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(HTTP_STATUS.NOT_FOUND, message, 'NOT_FOUND');
  }

  static conflict(message = 'Conflict', code = 'CONFLICT', details = null) {
    return new ApiError(HTTP_STATUS.CONFLICT, message, code, details);
  }

  static internal(message = 'Internal server error') {
    return new ApiError(HTTP_STATUS.INTERNAL_SERVER_ERROR, message, 'INTERNAL_ERROR');
  }
}
