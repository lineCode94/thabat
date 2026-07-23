import { Router } from 'express';

import { PERMISSIONS } from '#constants/permissionRegistry.js';
import { getAllBadges } from '#controllers/badge.controller.js';
import { authenticate } from '#middlewares/auth.middleware.js';
import { requirePermission } from '#middlewares/permission.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', requirePermission(PERMISSIONS.BADGES_VIEW), getAllBadges);

export default router;
