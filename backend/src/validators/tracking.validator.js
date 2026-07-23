import { z } from 'zod';

const uuid = z.string().uuid();
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD format');

export const submitTrackingSchema = z.object({
  body: z.object({
    entries: z.array(
      z.object({
        worshipItemId: uuid,
        isCompleted: z.boolean().default(false),
        count: z.number().int().optional(),
        duration: z.number().int().optional(),
        notes: z.string().optional(),
      })
    ).min(1, 'At least one tracking entry is required'),
  }),
});

export const trackingHistorySchema = z.object({
  params: z.object({}).optional(),
  query: z.object({
    weekStartDate: dateKey.optional(),
    userId: uuid.optional(),
  }).optional(),
  body: z.object({}).optional(),
});

export const updateTrackingCustomScheduleSchema = z.object({
  params: z.object({}).optional(),
  query: z.object({}).optional(),
  body: z.object({
    customItemIds: z.array(uuid).max(200).optional(),
    excludedItemIds: z.array(uuid).max(200).optional(),
  }).strict(),
});

export const createTrackingCustomWorshipItemSchema = z.object({
  params: z.object({}).optional(),
  query: z.object({}).optional(),
  body: z.object({
    title: z.string().trim().min(2).max(120),
    categoryId: uuid,
  }).strict(),
});

export const reopenTrackingWeekSchema = z.object({
  params: z.object({
    weekStartDate: dateKey,
  }),
  query: z.object({}).optional(),
  body: z.object({
    userId: uuid,
  }).strict(),
});
