-- CreateEnum
CREATE TYPE "QuranTrackType" AS ENUM ('MEMORIZING', 'REVIEWING');

-- CreateTable
CREATE TABLE "quran_progress" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "trackType" "QuranTrackType" NOT NULL,
    "startingJuzMemorized" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "cumulativeJuzMemorized" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "weeklyTargetJuz" DECIMAL(5,2),
    "startedAt" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quran_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quran_weekly_logs" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "quranProgressId" UUID NOT NULL,
    "weekStartDate" DATE NOT NULL,
    "weekEndDate" DATE NOT NULL,
    "trackType" "QuranTrackType" NOT NULL,
    "amountJuz" DECIMAL(5,2) NOT NULL,
    "cumulativeAfter" DECIMAL(5,2),
    "correctedAt" TIMESTAMP(3),
    "correctedById" UUID,
    "correctionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quran_weekly_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quran_progress_userId_key" ON "quran_progress"("userId");

-- CreateIndex
CREATE INDEX "quran_progress_trackType_idx" ON "quran_progress"("trackType");

-- CreateIndex
CREATE INDEX "quran_weekly_logs_userId_idx" ON "quran_weekly_logs"("userId");

-- CreateIndex
CREATE INDEX "quran_weekly_logs_quranProgressId_idx" ON "quran_weekly_logs"("quranProgressId");

-- CreateIndex
CREATE INDEX "quran_weekly_logs_weekStartDate_idx" ON "quran_weekly_logs"("weekStartDate");

-- CreateIndex
CREATE INDEX "quran_weekly_logs_trackType_idx" ON "quran_weekly_logs"("trackType");

-- CreateIndex
CREATE UNIQUE INDEX "quran_weekly_logs_userId_weekStartDate_key" ON "quran_weekly_logs"("userId", "weekStartDate");

-- AddForeignKey
ALTER TABLE "quran_progress" ADD CONSTRAINT "quran_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quran_weekly_logs" ADD CONSTRAINT "quran_weekly_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quran_weekly_logs" ADD CONSTRAINT "quran_weekly_logs_quranProgressId_fkey" FOREIGN KEY ("quranProgressId") REFERENCES "quran_progress"("id") ON DELETE CASCADE ON UPDATE CASCADE;
