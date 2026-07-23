import { Router } from 'express';


import adminMentorRoutes from '#routes/admin-mentor.routes.js';
import adminTrackingRoutes from '#routes/admin-tracking.routes.js';
import adminUserRoutes from '#routes/admin-user.routes.js';
import auditLogRoutes from '#routes/audit-log.routes.js';
import authRoutes from '#routes/auth.routes.js';
import badgeRoutes from '#routes/badge.routes.js';
import dashboardRoutes from '#routes/dashboard.routes.js';
import healthRoutes from '#routes/health.routes.js';
import meRoutes from '#routes/me.routes.js';
import mentorAssignmentRoutes from '#routes/mentor-assignment.routes.js';
import mentorDashboardRoutes from '#routes/mentor-dashboard.routes.js';
import missionRoutes from '#routes/mission.routes.js';
import profileRoutes from '#routes/profile.routes.js';
import promotionRoutes from '#routes/promotion.routes.js';
import regionRoutes from '#routes/region.routes.js';
import reportRoutes from '#routes/report.routes.js';
import trackingRoutes from '#routes/tracking.routes.js';
import weeklyReviewRoutes from '#routes/weekly-review.routes.js';
import worshipLevelRoutes from '#routes/worship-level.routes.js';
import worshipRoutes from '#routes/worship.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/worship-levels', worshipLevelRoutes);
router.use('/worship', worshipRoutes);
router.use('/tracking', trackingRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/profile', profileRoutes);
router.use('/regions', regionRoutes);
router.use('/reports', reportRoutes);
router.use('/me', meRoutes);
router.use('/mentor', mentorDashboardRoutes);
router.use('/missions', missionRoutes);
router.use('/badges', badgeRoutes);
router.use('/admin/users', adminUserRoutes);
router.use('/admin/mentors', adminMentorRoutes);
router.use('/admin/tracking', adminTrackingRoutes);
router.use('/admin/mentor-assignments', mentorAssignmentRoutes);
router.use('/admin/audit-logs', auditLogRoutes);
router.use('/', weeklyReviewRoutes);
router.use('/', promotionRoutes);

export default router;
