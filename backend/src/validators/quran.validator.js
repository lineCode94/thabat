import { z } from 'zod';

import { QURAN_TRACK_TYPES } from '#constants/quran.js';

const pageAmount = z.coerce.number().min(0).max(604);
const positivePagePace = z.coerce.number().positive().max(604);
const juzAmount = z.coerce.number().min(0).max(30);

export const quranTargetUserQuerySchema = z.object({
  query: z.object({
    userId: z.string().uuid().optional(),
  }).default({}),
  params: z.object({}).default({}),
  body: z.object({}).default({}),
});

export const quranHistorySchema = z.object({
  query: z.object({
    userId: z.string().uuid().optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
  }).default({}),
  params: z.object({}).default({}),
  body: z.object({}).default({}),
});

export const quranSetupSchema = z.object({
  body: z.object({
    trackType: z.enum(Object.values(QURAN_TRACK_TYPES)),
    memorizedJuz: juzAmount.optional(),
    cumulativePagesMemorized: pageAmount.optional(),
    weeklyTargetPages: positivePagePace.optional(),
    cumulativeJuzMemorized: pageAmount.optional(),
    weeklyTargetJuz: positivePagePace.optional(),
    startedAt: z.coerce.date().optional(),
  }).superRefine((value, ctx) => {
    const weeklyTarget = value.weeklyTargetPages ?? value.weeklyTargetJuz;
    if (!weeklyTarget) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['weeklyTargetPages'],
        message: 'weeklyTargetPages is required',
      });
    }
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({}),
});

export const quranWeeklyLogSchema = z.object({
  body: z.object({
    amountPages: pageAmount.optional(),
    amountJuz: pageAmount.optional(),
  }).superRefine((value, ctx) => {
    const amount = value.amountPages ?? value.amountJuz;
    if (!amount || amount <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['amountPages'],
        message: 'amountPages must be greater than 0',
      });
    }
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({}),
});

export const quranTargetUpdateSchema = z.object({
  body: z.object({
    weeklyTargetPages: positivePagePace,
  }),
  params: z.object({}).default({}),
  query: z.object({}).default({}),
});

export const quranCorrectionSchema = z.object({
  params: z.object({
    logId: z.string().uuid(),
  }),
  body: z.object({
    amountPages: pageAmount.optional(),
    amountJuz: pageAmount.optional(),
    reason: z.string().trim().min(3).max(500),
  }).superRefine((value, ctx) => {
    const amount = value.amountPages ?? value.amountJuz;
    if (!amount || amount <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['amountPages'],
        message: 'amountPages must be greater than 0',
      });
    }
  }),
  query: z.object({}).default({}),
});
