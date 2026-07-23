import { Router } from 'express';

import { PERMISSIONS } from '#constants/permissionRegistry.js';
import { WorshipController } from '#controllers/worship.controller.js';
import { asyncHandler } from '#helpers/asyncHandler.js';
import { authenticate } from '#middlewares/auth.middleware.js';
import { requirePermission } from '#middlewares/permission.middleware.js';
import { validateRequest } from '#middlewares/validateRequest.js';
import {
  createCategorySchema, updateCategorySchema,
  createWorshipItemSchema, updateDefaultLevelRequirementSchema, updateWorshipItemSchema
} from '#validators/worship.validator.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ─── User-facing read-only routes ────────────────────────────────────────────
router.get('/categories', requirePermission(PERMISSIONS.WORSHIP_VIEW), asyncHandler(WorshipController.getCategories));
router.get('/categories/:id', requirePermission(PERMISSIONS.WORSHIP_VIEW), asyncHandler(WorshipController.getCategoryById));
router.get('/items', requirePermission(PERMISSIONS.WORSHIP_VIEW), asyncHandler(WorshipController.getItems));
router.get('/items/:id', requirePermission(PERMISSIONS.WORSHIP_VIEW), asyncHandler(WorshipController.getItemById));

// ─── Admin-only CRUD routes ───────────────────────────────────────────────────
router.post('/categories', requirePermission(PERMISSIONS.WORSHIP_CATEGORIES_MANAGE), validateRequest(createCategorySchema), asyncHandler(WorshipController.createCategory));
router.put('/categories/:id', requirePermission(PERMISSIONS.WORSHIP_CATEGORIES_MANAGE), validateRequest(updateCategorySchema), asyncHandler(WorshipController.updateCategory));
router.delete('/categories/:id', requirePermission(PERMISSIONS.WORSHIP_CATEGORIES_MANAGE), asyncHandler(WorshipController.deleteCategory));

router.post('/items', requirePermission(PERMISSIONS.WORSHIP_ITEMS_MANAGE), validateRequest(createWorshipItemSchema), asyncHandler(WorshipController.createItem));
router.put('/items/:id', requirePermission(PERMISSIONS.WORSHIP_ITEMS_MANAGE), validateRequest(updateWorshipItemSchema), asyncHandler(WorshipController.updateItem));
router.patch('/items/:id/default-level-requirement', requirePermission(PERMISSIONS.WORSHIP_ITEMS_MANAGE), validateRequest(updateDefaultLevelRequirementSchema), asyncHandler(WorshipController.setDefaultLevelRequirement));
router.delete('/items/:id', requirePermission(PERMISSIONS.WORSHIP_ITEMS_MANAGE), asyncHandler(WorshipController.deleteItem));

export default router;
