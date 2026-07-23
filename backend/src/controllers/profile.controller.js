import { ProfileService } from '#services/profile.service.js';
import { ApiResponse } from '#utils/apiResponse.js';

export class ProfileController {
  static async getProfile(req, res) {
    const profile = await ProfileService.getProfile(req.user.id);
    return ApiResponse.success(res, profile);
  }

  static async updateProfile(req, res) {
    const updatedProfile = await ProfileService.updateProfile(req.user.id, req.body);
    return ApiResponse.success(res, updatedProfile, { message: 'Profile updated successfully' });
  }

  static async changePassword(req, res) {
    await ProfileService.changePassword(req.user.id, req.body);
    return ApiResponse.success(res, null, { message: 'Password updated successfully' });
  }
}
