-- AlterTable
ALTER TABLE "reports"
ADD COLUMN IF NOT EXISTS "periodEndDate" DATE,
ADD COLUMN IF NOT EXISTS "periodStartDate" DATE;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "reports_periodStartDate_idx" ON "reports"("periodStartDate");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "reports_userId_type_periodStartDate_key"
ON "reports"("userId", "type", "periodStartDate");
