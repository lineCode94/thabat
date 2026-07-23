import { WeeklyReviewService } from '#services/weekly-review.service.js';
import { ApiResponse } from '#utils/apiResponse.js';

export class WeeklyReviewController {
  static async listReviews(req, res) {
    const result = await WeeklyReviewService.listReviews(req.user, req.permissions, req.query);
    return ApiResponse.paginated(res, result.reviews, result.meta);
  }

  static async getReview(req, res) {
    const review = await WeeklyReviewService.getReview(req.user, req.permissions, req.params.id);
    return ApiResponse.success(res, review);
  }

  static async getCurrentReviewContext(req, res) {
    const result = await WeeklyReviewService.getCurrentReviewContext(
      req.user,
      req.permissions,
      req.params.userId,
    );
    return ApiResponse.success(res, result);
  }

  static async createCurrentReview(req, res) {
    const review = await WeeklyReviewService.createCurrentReview(
      req.user,
      req.permissions,
      req.params.userId,
    );
    return ApiResponse.created(res, review, 'Weekly review initialized');
  }

  static async updateReview(req, res) {
    const review = await WeeklyReviewService.updateReview(
      req.user,
      req.permissions,
      req.params.id,
      req.body,
    );
    return ApiResponse.success(res, review, { message: 'Weekly review saved' });
  }

  static async completeReview(req, res) {
    const review = await WeeklyReviewService.completeReview(req.user, req.permissions, req.params.id);
    return ApiResponse.success(res, review, { message: 'Weekly review completed' });
  }
}
