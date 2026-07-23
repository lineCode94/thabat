CREATE TYPE "PromotionStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED');

CREATE TABLE "worship_levels" (
  "id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "worship_levels_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "worship_levels_order_key" ON "worship_levels"("order");
CREATE INDEX "worship_levels_isActive_idx" ON "worship_levels"("isActive");
CREATE INDEX "worship_levels_deletedAt_idx" ON "worship_levels"("deletedAt");

CREATE TABLE "promotion_recommendations" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "recommendedById" UUID NOT NULL,
  "previousLevelId" UUID NOT NULL,
  "nextLevelId" UUID NOT NULL,
  "status" "PromotionStatus" NOT NULL DEFAULT 'PENDING',
  "readinessSnapshot" JSONB NOT NULL,
  "reason" TEXT,
  "decisionNotes" TEXT,
  "approvedById" UUID,
  "approvedAt" TIMESTAMP(3),
  "declinedById" UUID,
  "declinedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "promotion_recommendations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "promotion_recommendations_userId_idx" ON "promotion_recommendations"("userId");
CREATE INDEX "promotion_recommendations_recommendedById_idx" ON "promotion_recommendations"("recommendedById");
CREATE INDEX "promotion_recommendations_previousLevelId_idx" ON "promotion_recommendations"("previousLevelId");
CREATE INDEX "promotion_recommendations_nextLevelId_idx" ON "promotion_recommendations"("nextLevelId");
CREATE INDEX "promotion_recommendations_status_idx" ON "promotion_recommendations"("status");

ALTER TABLE "user_levels"
ADD CONSTRAINT "user_levels_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "worship_levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "level_requirements"
ADD CONSTRAINT "level_requirements_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "worship_levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "promotion_recommendations"
ADD CONSTRAINT "promotion_recommendations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
ADD CONSTRAINT "promotion_recommendations_recommendedById_fkey" FOREIGN KEY ("recommendedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
ADD CONSTRAINT "promotion_recommendations_previousLevelId_fkey" FOREIGN KEY ("previousLevelId") REFERENCES "worship_levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
ADD CONSTRAINT "promotion_recommendations_nextLevelId_fkey" FOREIGN KEY ("nextLevelId") REFERENCES "worship_levels"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
ADD CONSTRAINT "promotion_recommendations_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
ADD CONSTRAINT "promotion_recommendations_declinedById_fkey" FOREIGN KEY ("declinedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
