import { AuthorizationService } from '#services/authorization.service.js';
import { WorshipService } from '#services/worship.service.js';
import { ApiResponse } from '#utils/apiResponse.js';

export class WorshipController {
  // Categories
  static async getCategories(req, res) {
    const includeInactive = AuthorizationService.canViewInactiveWorship(req) && req.query.all === 'true';
    const categories = await WorshipService.getCategories(includeInactive);
    return ApiResponse.success(res, categories);
  }

  static async getCategoryById(req, res) {
    const category = await WorshipService.getCategoryById(req.params.id);
    return ApiResponse.success(res, category);
  }

  static async createCategory(req, res) {
    const category = await WorshipService.createCategory(req.body);
    return ApiResponse.created(res, category, 'Category created');
  }

  static async updateCategory(req, res) {
    const category = await WorshipService.updateCategory(req.params.id, req.body);
    return ApiResponse.success(res, category, { message: 'Category updated' });
  }

  static async deleteCategory(req, res) {
    await WorshipService.deleteCategory(req.params.id);
    return ApiResponse.success(res, null, { message: 'Category deleted' });
  }

  // Items
  static async getItems(req, res) {
    const includeInactive = AuthorizationService.canViewInactiveWorship(req) && req.query.all === 'true';
    const items = await WorshipService.getItems(includeInactive);
    return ApiResponse.success(res, items);
  }

  static async getItemById(req, res) {
    const item = await WorshipService.getItemById(req.params.id);
    return ApiResponse.success(res, item);
  }

  static async createItem(req, res) {
    const item = await WorshipService.createItem(req.body);
    return ApiResponse.created(res, item, 'Item created');
  }

  static async updateItem(req, res) {
    const item = await WorshipService.updateItem(req.params.id, req.body);
    return ApiResponse.success(res, item, { message: 'Item updated' });
  }

  static async deleteItem(req, res) {
    await WorshipService.deleteItem(req.params.id);
    return ApiResponse.success(res, null, { message: 'Item deleted' });
  }

  static async setDefaultLevelRequirement(req, res) {
    const item = await WorshipService.setDefaultLevelRequirement(req.params.id, req.body.isRequired);
    return ApiResponse.success(res, item, { message: 'Daily schedule updated' });
  }
}
