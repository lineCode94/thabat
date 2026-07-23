import { BadgeEngine } from '#services/badge.engine.js';
import { ApiResponse } from '#utils/apiResponse.js';
import { catchAsync } from '#utils/catchAsync.js';

// GET /badges - all badge definitions (public catalogue)
export const getAllBadges = catchAsync(async (req, res) => {
  const badges = await BadgeEngine.getUserBadges(req.user.id);

  return ApiResponse.success(res, badges);
});
