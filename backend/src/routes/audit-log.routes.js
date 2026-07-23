import { Router } from 'express';

import { PERMISSIONS } from '#constants/permissionRegistry.js';
import { AuditLogController } from '#controllers/audit-log.controller.js';
import { asyncHandler } from '#helpers/asyncHandler.js';
import { authenticate } from '#middlewares/auth.middleware.js';
import { requirePermission } from '#middlewares/permission.middleware.js';
import { validateRequest } from '#middlewares/validateRequest.js';
import { listAuditLogsSchema } from '#validators/audit-log.validator.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  requirePermission(PERMISSIONS.AUDIT_LOGS_VIEW),
  validateRequest(listAuditLogsSchema),
  asyncHandler(AuditLogController.listAuditLogs),
);

export default router;
