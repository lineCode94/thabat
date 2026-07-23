Implemented Sprint 6.6 schema additions:

- WorshipLevel
- PromotionStatus
- PromotionRecommendation

WorshipLevel is separate from the XP-based Gamification Level system.

UserLevel.levelId references WorshipLevel.id.

LevelRequirement.levelId references WorshipLevel.id.

PromotionRecommendation stores persistent promotion workflow history and readiness snapshots.

Recovery R2 schema additions:

- `OnboardingStatus`
- `User.onboardingStatus`

`OnboardingStatus` values:

- `PENDING_SETUP`
- `ACTIVE`

Normal USER accounts must have exactly one active `UserLevel`. Prisma cannot express a partial unique constraint for "one active UserLevel per user" portably, so the invariant is enforced transactionally in services and repaired by `npm run repair:onboarding`.
