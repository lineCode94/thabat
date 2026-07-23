import { XpService } from './xp.service.js';

import { calculateLevelFromXp } from '#config/gamification.js';

export class LevelService {
  // Gamification level only. Worship Level promotion is handled by PromotionService.
  static async getUserLevelInfo(userId) {
    const totalXp = await XpService.getTotalXp(userId);
    return calculateLevelFromXp(totalXp);
  }
}
