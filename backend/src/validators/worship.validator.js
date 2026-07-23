import { z } from 'zod';

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const createWorshipItemSchema = z.object({
  body: z.object({
    categoryId: z.string().uuid(),
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    icon: z.string().optional(),
    inputType: z.enum(['BOOLEAN', 'COUNT', 'DURATION', 'TEXT']),
    targetType: z.string().optional(),
    targetValue: z.number().int().positive().optional(),
    daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
    order: z.number().int().default(0),
    score: z.number().int().min(0).optional(),
    xp: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateWorshipItemSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    categoryId: z.string().uuid().optional(),
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    icon: z.string().optional(),
    inputType: z.enum(['BOOLEAN', 'COUNT', 'DURATION', 'TEXT']).optional(),
    targetType: z.string().optional(),
    targetValue: z.number().int().positive().nullable().optional(),
    daysOfWeek: z.array(z.number().int().min(0).max(6)).optional(),
    order: z.number().int().optional(),
    score: z.number().int().min(0).optional(),
    xp: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateDefaultLevelRequirementSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    isRequired: z.boolean(),
  }),
});
