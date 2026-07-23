CREATE TYPE "WeeklyReviewStatus" AS ENUM ('PENDING', 'DRAFT', 'COMPLETED');

ALTER TABLE "weekly_reviews"
ADD COLUMN "status" "WeeklyReviewStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "completedAt" TIMESTAMP(3);

CREATE INDEX "weekly_reviews_status_idx" ON "weekly_reviews"("status");
