import { PromotionReadinessService } from '#services/promotion-readiness.service.js';
import { PromotionService } from '#services/promotion.service.js';
import { ApiResponse } from '#utils/apiResponse.js';

export class PromotionController {
  static async getReadiness(req, res) {
    const readiness = await PromotionReadinessService.evaluate(
      req.user,
      req.permissions,
      req.params.userId,
    );
    return ApiResponse.success(res, readiness);
  }

  static async createRecommendation(req, res) {
    const promotion = await PromotionService.createRecommendation(
      req.user,
      req.permissions,
      req.params.userId,
      req.body,
    );
    return ApiResponse.created(res, promotion, 'Promotion recommendation created');
  }

  static async listPromotions(req, res) {
    const result = await PromotionService.listPromotions(req.user, req.permissions, req.query);
    return ApiResponse.paginated(res, result.promotions, result.meta);
  }

  static async getPromotion(req, res) {
    const promotion = await PromotionService.getPromotion(req.user, req.permissions, req.params.id);
    return ApiResponse.success(res, promotion);
  }

  static async approve(req, res) {
    const promotion = await PromotionService.approve(req.user, req.permissions, req.params.id);
    return ApiResponse.success(res, promotion, { message: 'Promotion approved' });
  }

  static async decline(req, res) {
    const promotion = await PromotionService.decline(
      req.user,
      req.permissions,
      req.params.id,
      req.body,
    );
    return ApiResponse.success(res, promotion, { message: 'Promotion declined' });
  }
}
