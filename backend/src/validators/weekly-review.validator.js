import { z } from 'zod';

const uuidParam = z.string().uuid();

export const reviewIdParamSchema = z.object({
  params: z.object({
    id: uuidParam,
  }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const userCurrentReviewSchema = z.object({
  params: z.object({
    userId: uuidParam,
  }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const createWeeklyReviewSchema = z.object({
  params: z.object({
    userId: uuidParam,
  }),
  query: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const listReviewsSchema = z.object({
  params: z.object({}).optional(),
  query: z.object({
    status: z.enum(['PENDING', 'DRAFT', 'COMPLETED']).optional(),
    userId: uuidParam.optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(20),
  }),
  body: z.object({}).optional(),
});

export const updateWeeklyReviewSchema = z.object({
  params: z.object({
    id: uuidParam,
  }),
  query: z.object({}).optional(),
  body: z.object({
    comment: z.string().trim().max(4000).nullable().optional(),
    privateNotes: z.string().trim().max(4000).nullable().optional(),
    rating: z.number().int().min(1).max(5).nullable().optional(),
    recommendation: z.string().trim().max(4000).nullable().optional(),
    promotionSuggestion: z.boolean().optional(),
  }).strict(),
});
