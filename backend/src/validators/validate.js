import { ApiError } from '#utils/apiError.js';

export function validate(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const errors = result.error.errors.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      return next(ApiError.badRequest('Validation failed', errors));
    }

    req.validated = result.data;
    return next();
  };
}
