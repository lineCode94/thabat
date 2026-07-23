-- Backfill migration for schema changes that existed in the database before R7
-- but were missing from migration history.

-- Badges
ALTER TABLE "badges" ADD COLUMN IF NOT EXISTS "key" TEXT;
UPDATE "badges" SET "key" = "name" WHERE "key" IS NULL;
ALTER TABLE "badges" ALTER COLUMN "key" SET NOT NULL;

ALTER TABLE "badges" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'General';
ALTER TABLE "badges" ADD COLUMN IF NOT EXISTS "rarity" TEXT NOT NULL DEFAULT 'Common';
ALTER TABLE "badges" ADD COLUMN IF NOT EXISTS "isVisible" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "badges" ADD COLUMN IF NOT EXISTS "condition" JSONB;
ALTER TABLE "badges" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS "badges_key_key" ON "badges"("key");
CREATE INDEX IF NOT EXISTS "badges_category_idx" ON "badges"("category");
CREATE INDEX IF NOT EXISTS "badges_rarity_idx" ON "badges"("rarity");
CREATE INDEX IF NOT EXISTS "badges_isVisible_idx" ON "badges"("isVisible");

-- Notifications
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "priority" TEXT NOT NULL DEFAULT 'MEDIUM';
ALTER TABLE "notifications" ADD COLUMN IF NOT EXISTS "metadata" JSONB;

-- Notification preferences
ALTER TABLE "notification_preferences" DROP COLUMN IF EXISTS "push";
ALTER TABLE "notification_preferences" ADD COLUMN IF NOT EXISTS "dailyReminders" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "notification_preferences" ADD COLUMN IF NOT EXISTS "weeklyReminders" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "notification_preferences" ADD COLUMN IF NOT EXISTS "achievements" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "notification_preferences" ADD COLUMN IF NOT EXISTS "missions" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "notification_preferences" ADD COLUMN IF NOT EXISTS "reminderTime" TEXT NOT NULL DEFAULT '07:30';
ALTER TABLE "notification_preferences" ADD COLUMN IF NOT EXISTS "quietHoursStart" TEXT;
ALTER TABLE "notification_preferences" ADD COLUMN IF NOT EXISTS "quietHoursEnd" TEXT;

-- XP transactions source uniqueness
DROP INDEX IF EXISTS "xp_transactions_sourceType_sourceId_idx";
CREATE UNIQUE INDEX IF NOT EXISTS "xp_transactions_userId_sourceType_sourceId_key"
ON "xp_transactions"("userId", "sourceType", "sourceId");
