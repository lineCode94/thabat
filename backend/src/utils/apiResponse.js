import { HTTP_STATUS } from '#constants/index.js';

export class ApiResponse {
  static success(res, data = null, options = {}) {
    const { message, statusCode = HTTP_STATUS.OK, meta } = options;
    const payload = {
      success: true,
      data,
    };

    if (message) {
      payload.message = message;
    }

    if (meta) {
      payload.meta = meta;
    }

    return res.status(statusCode).json(payload);
  }

  static created(res, data = null, message) {
    return ApiResponse.success(res, data, { message, statusCode: HTTP_STATUS.CREATED });
  }

  static noContent(res) {
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  }

  static paginated(res, data, pagination, message) {
    return ApiResponse.success(res, data, {
      message,
      meta: {
        pagination,
      },
    });
  }
}
