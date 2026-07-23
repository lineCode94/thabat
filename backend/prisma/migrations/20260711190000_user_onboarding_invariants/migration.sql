-- Recovery R2: explicit onboarding state for public self-registration.
CREATE TYPE "OnboardingStatus" AS ENUM ('PENDING_SETUP', 'ACTIVE');

ALTER TABLE "users"
ADD COLUMN "onboardingStatus" "OnboardingStatus" NOT NULL DEFAULT 'PENDING_SETUP';

CREATE INDEX "users_onboardingStatus_idx" ON "users"("onboardingStatus");
