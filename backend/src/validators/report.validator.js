import { z } from 'zod';

const uuid = z.string().uuid();
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD format');
const monthKey = z.string().regex(/^\d{4}-\d{2}$/, 'Month must use YYYY-MM format');

export const dailyReportSchema = z.object({
  params: z.object({}).optional(),
  query: z.object({
    date: dateKey.optional(),
    userId: uuid.optional(),
  }).optional(),
  body: z.object({}).optional(),
});

export const weeklyReportSchema = z.object({
  params: z.object({}).optional(),
  query: z.object({
    weekStartDate: dateKey.optional(),
    userId: uuid.optional(),
  }).optional(),
  body: z.object({}).optional(),
});

export const monthlyReportSchema = z.object({
  params: z.object({}).optional(),
  query: z.object({
    month: monthKey.optional(),
    userId: uuid.optional(),
  }).optional(),
  body: z.object({}).optional(),
});
