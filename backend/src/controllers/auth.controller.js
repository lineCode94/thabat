import { AuthService } from '#services/auth.service.js';
import { OnboardingService } from '#services/onboarding.service.js';
import { ApiResponse } from '#utils/apiResponse.js';

export class AuthController {
  static async register(req, res) {
    const { user, token } = await AuthService.register(req.body);
    return ApiResponse.created(res, { user, token }, 'User registered successfully');
  }

  static async login(req, res) {
    const { user, token } = await AuthService.login(req.body);
    return ApiResponse.success(res, { user, token }, { message: 'Login successful' });
  }

  static async me(req, res) {
    const user = await OnboardingService.getUserSessionContext(req.user.id);
    return ApiResponse.success(res, user);
  }
}
