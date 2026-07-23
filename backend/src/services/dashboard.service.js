import { OnboardingService } from './onboarding.service.js';
import { TrackingService } from './tracking.service.js';

import { prisma } from '#lib/prisma.js';

export class DashboardService {
  static async getSummary(userId, timezone) {
    const today = TrackingService._getTodayForTimezone(timezone);
    const readiness = await OnboardingService.resolveTodayWorshipReadiness(userId);

    if (!readiness.ready) {
      return {
        completedItems: 0,
        totalItems: 0,
        progressPercentage: 0,
      };
    }

    const trackingDay = await prisma.trackingDay.findUnique({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
    });

    const summary = await TrackingService.calculateSummary(
      trackingDay?.id,
      readiness.items.length,
      readiness.items.map((item) => item.id),
    );
    return summary;
  }
}
