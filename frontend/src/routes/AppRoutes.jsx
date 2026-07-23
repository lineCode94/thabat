import { lazy, Suspense } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';

import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { APP_ROUTES } from '@/constants';
import { AuthLayout } from '@/layouts/AuthLayout';
import { MainLayout } from '@/layouts/MainLayout';
import { NotFoundPage } from '@/pages/NotFoundPage';

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage').then((module) => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage').then((module) => ({ default: module.RegisterPage })));
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage').then((module) => ({ default: module.DashboardPage })));
const DailyTrackingPage = lazy(() => import('@/features/tracking/pages/DailyTrackingPage').then((module) => ({ default: module.DailyTrackingPage })));
const WorshipPage = lazy(() => import('@/features/worship/pages/WorshipPage').then((module) => ({ default: module.WorshipPage })));
const ProfilePage = lazy(() => import('@/features/profile/pages/ProfilePage').then((module) => ({ default: module.ProfilePage })));
const SettingsPage = lazy(() => import('@/features/profile/pages/SettingsPage').then((module) => ({ default: module.SettingsPage })));
const NotificationsPage = lazy(() => import('@/features/notifications/pages/NotificationsPage').then((module) => ({ default: module.NotificationsPage })));
const AchievementsPage = lazy(() => import('@/features/gamification/pages/AchievementsPage').then((module) => ({ default: module.AchievementsPage })));
const BadgesPage = lazy(() => import('@/features/gamification/pages/BadgesPage').then((module) => ({ default: module.BadgesPage })));
const MissionsPage = lazy(() => import('@/features/missions').then((module) => ({ default: module.MissionsPage })));
const ReportsPage = lazy(() => import('@/features/reports').then((module) => ({ default: module.ReportsPage })));
const DailyReportPage = lazy(() => import('@/features/reports/daily').then((module) => ({ default: module.DailyReportPage })));
const WeeklyReportPage = lazy(() => import('@/features/reports/weekly').then((module) => ({ default: module.WeeklyReportPage })));
const MonthlyReportPage = lazy(() => import('@/features/reports/monthly').then((module) => ({ default: module.MonthlyReportPage })));
const ReportPlaceholderPage = lazy(() => import('@/features/reports').then((module) => ({ default: module.ReportPlaceholderPage })));
const MentorDashboardPage = lazy(() => import('@/features/mentor').then((module) => ({ default: module.MentorDashboardPage })));
const MentorReviewsPage = lazy(() => import('@/features/reviews').then((module) => ({ default: module.MentorReviewsPage })));
const ReviewDetailPage = lazy(() => import('@/features/reviews').then((module) => ({ default: module.ReviewDetailPage })));
const UserReviewsPage = lazy(() => import('@/features/reviews').then((module) => ({ default: module.UserReviewsPage })));
const PromotionRecommendationsPage = lazy(() => import('@/features/promotion').then((module) => ({ default: module.PromotionRecommendationsPage })));
const PromotionDetailPage = lazy(() => import('@/features/promotion').then((module) => ({ default: module.PromotionDetailPage })));
const MentorAssignmentsPage = lazy(() => import('@/features/admin/mentor-assignments').then((module) => ({ default: module.MentorAssignmentsPage })));
const RegionsPage = lazy(() => import('@/features/admin/regions').then((module) => ({ default: module.RegionsPage })));
const UsersPage = lazy(() => import('@/features/admin/users').then((module) => ({ default: module.UsersPage })));
const WorshipSchedulePage = lazy(() => import('@/features/admin/worship-schedule').then((module) => ({ default: module.WorshipSchedulePage })));
const WorshipLevelsPage = lazy(() => import('@/features/admin/worship-levels').then((module) => ({ default: module.WorshipLevelsPage })));
const TasbihPage = lazy(() => import('@/features/tools').then((module) => ({ default: module.TasbihPage })));
const PrayerProgressPage = lazy(() => import('@/features/tools').then((module) => ({ default: module.PrayerProgressPage })));
const RamadanCountdownPage = lazy(() => import('@/features/tools').then((module) => ({ default: module.RamadanCountdownPage })));

function RouteLoader() {
  return (
    <div className="flex min-h-[320px] items-center justify-center">
      <div className="h-10 w-10 animate-pulse rounded-2xl bg-primary/25" aria-hidden="true" />
    </div>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<MainLayout />}>
        <Route path={APP_ROUTES.HOME} element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard"
          element={(
            <PermissionGuard permissions={['dashboard.view']} fallback={<NotFoundPage />}>
              <DashboardPage />
            </PermissionGuard>
          )}
        />
        <Route
          path="/tracking"
          element={(
            <PermissionGuard permissions={['tracking.manage_self']} fallback={<NotFoundPage />}>
              <DailyTrackingPage />
            </PermissionGuard>
          )}
        />
        <Route
          path="/worship"
          element={(
            <PermissionGuard permissions={['worship.items.manage']} fallback={<NotFoundPage />}>
              <WorshipPage />
            </PermissionGuard>
          )}
        />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route
          path="/notifications"
          element={(
            <PermissionGuard permissions={['notifications.view_own', 'notifications.view_assigned', 'notifications.manage_region', 'notifications.manage_all']} mode="any" fallback={<NotFoundPage />}>
              <NotificationsPage />
            </PermissionGuard>
          )}
        />
        <Route
          path="/achievements"
          element={(
            <PermissionGuard permissions={['achievements.view', 'achievements.manage']} mode="any" fallback={<NotFoundPage />}>
              <AchievementsPage />
            </PermissionGuard>
          )}
        />
        <Route
          path="/badges"
          element={(
            <PermissionGuard permissions={['badges.view', 'badges.manage']} mode="any" fallback={<NotFoundPage />}>
              <BadgesPage />
            </PermissionGuard>
          )}
        />
        <Route
          path="/missions"
          element={(
            <PermissionGuard permissions={['missions.view_own', 'missions.assign', 'missions.manage_region', 'missions.manage_all']} mode="any" fallback={<NotFoundPage />}>
              <MissionsPage />
            </PermissionGuard>
          )}
        />
        <Route path="/tools" element={<Navigate to="/tools/tasbih" replace />} />
        <Route path="/tools/tasbih" element={<TasbihPage />} />
        <Route path="/tools/prayer-progress" element={<PrayerProgressPage />} />
        <Route path="/tools/ramadan-countdown" element={<RamadanCountdownPage />} />
        <Route
          path="/reports"
          element={(
            <PermissionGuard permissions={['reports.view_own', 'reports.view_assigned', 'reports.view_region', 'reports.view_all']} mode="any" fallback={<NotFoundPage />}>
              <ReportsPage />
            </PermissionGuard>
          )}
        />
        <Route
          path="/reports/daily"
          element={(
            <PermissionGuard permissions={['reports.view_own', 'reports.view_assigned', 'reports.view_region', 'reports.view_all']} mode="any" fallback={<NotFoundPage />}>
              <DailyReportPage />
            </PermissionGuard>
          )}
        />
        <Route
          path="/reports/weekly"
          element={(
            <PermissionGuard permissions={['reports.view_own', 'reports.view_assigned', 'reports.view_region', 'reports.view_all']} mode="any" fallback={<NotFoundPage />}>
              <WeeklyReportPage />
            </PermissionGuard>
          )}
        />
        <Route
          path="/reports/monthly"
          element={(
            <PermissionGuard permissions={['reports.view_own', 'reports.view_assigned', 'reports.view_region', 'reports.view_all']} mode="any" fallback={<NotFoundPage />}>
              <MonthlyReportPage />
            </PermissionGuard>
          )}
        />
        <Route
          path="/reports/:reportType"
          element={(
            <PermissionGuard permissions={['reports.view_own', 'reports.view_assigned', 'reports.view_region', 'reports.view_all']} mode="any" fallback={<NotFoundPage />}>
              <ReportPlaceholderPage />
            </PermissionGuard>
          )}
        />
        <Route
          path="/mentor/dashboard"
          element={(
            <PermissionGuard permissions={['reviews.manage_assigned', 'reviews.manage_region', 'reviews.manage_all']} mode="any" fallback={<NotFoundPage />}>
              <MentorDashboardPage />
            </PermissionGuard>
          )}
        />
        <Route
          path="/mentor/reviews"
          element={(
            <PermissionGuard permissions={['reviews.manage_assigned', 'reviews.manage_region', 'reviews.manage_all']} mode="any" fallback={<NotFoundPage />}>
              <MentorReviewsPage />
            </PermissionGuard>
          )}
        />
        <Route
          path="/mentor/reviews/:id"
          element={(
            <PermissionGuard permissions={['reviews.manage_assigned', 'reviews.manage_region', 'reviews.manage_all']} mode="any" fallback={<NotFoundPage />}>
              <ReviewDetailPage />
            </PermissionGuard>
          )}
        />
        <Route
          path="/reviews"
          element={(
            <PermissionGuard permissions={['reviews.view_own']} fallback={<NotFoundPage />}>
              <UserReviewsPage />
            </PermissionGuard>
          )}
        />
        <Route
          path="/reviews/:id"
          element={(
            <PermissionGuard permissions={['reviews.view_own']} fallback={<NotFoundPage />}>
              <ReviewDetailPage userView />
            </PermissionGuard>
          )}
        />
        <Route
          path="/promotions"
          element={(
            <PermissionGuard permissions={['levels.promote']} fallback={<NotFoundPage />}>
              <PromotionRecommendationsPage />
            </PermissionGuard>
          )}
        />
        <Route
          path="/promotions/:id"
          element={(
            <PermissionGuard permissions={['levels.promote']} fallback={<NotFoundPage />}>
              <PromotionDetailPage />
            </PermissionGuard>
          )}
        />
        <Route
          path="/admin/mentor-assignments"
          element={(
            <PermissionGuard permissions={['users.assign', 'users.transfer_mentor', 'users.manage_all', 'users.manage_region']} mode="any" fallback={<NotFoundPage />}>
              <MentorAssignmentsPage />
            </PermissionGuard>
          )}
        />
        <Route
          path="/admin/regions"
          element={(
            <PermissionGuard permissions={['regions.manage']} fallback={<NotFoundPage />}>
              <RegionsPage />
            </PermissionGuard>
          )}
        />
        <Route
          path="/admin/users"
          element={(
            <PermissionGuard permissions={['users.manage_all', 'users.manage_region']} mode="any" fallback={<NotFoundPage />}>
              <UsersPage />
            </PermissionGuard>
          )}
        />
        <Route
          path="/admin/worship-curriculum"
          element={(
            <PermissionGuard permissions={['worship.items.manage']} fallback={<NotFoundPage />}>
              <WorshipSchedulePage />
            </PermissionGuard>
          )}
        />
        <Route
          path="/admin/worship-levels"
          element={(
            <PermissionGuard permissions={['levels.manage', 'levels.promote']} mode="any" fallback={<NotFoundPage />}>
              <WorshipLevelsPage />
            </PermissionGuard>
          )}
        />
        <Route path="/admin/worship-schedule" element={<Navigate to="/admin/worship-curriculum" replace />} />
          <Route path={APP_ROUTES.NOT_FOUND} element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
