import { Router } from 'express';

import { ApiResponse } from '#utils/apiResponse.js';

const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  return ApiResponse.success(res, {
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

export default healthRouter;
