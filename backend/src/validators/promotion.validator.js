import { z } from 'zod';

const uuidParam = z.string().uuid();

export const userPromotionReadinessSchema = z.object({
  params: z.object({ userId: uuidParam }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const createPromotionRecommendationSchema = z.object({
  params: z.object({ userId: uuidParam }),
  query: z.object({}).optional(),
  body: z.object({
    reason: z.string().trim().max(2000).optional(),
  }).strict().optional(),
});

export const promotionIdSchema = z.object({
  params: z.object({ id: uuidParam }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const declinePromotionSchema = z.object({
  params: z.object({ id: uuidParam }),
  query: z.object({}).optional(),
  body: z.object({
    decisionNotes: z.string().trim().max(2000).optional(),
  }).strict().optional(),
});

export const listPromotionsSchema = z.object({
  params: z.object({}).optional(),
  query: z.object({
    status: z.enum(['PENDING', 'APPROVED', 'DECLINED']).optional(),
    userId: uuidParam.optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(20),
  }),
  body: z.object({}).optional(),
});
