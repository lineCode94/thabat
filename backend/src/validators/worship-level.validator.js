import { z } from 'zod';

const levelBodySchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  order: z.number().int().positive(),
  description: z.string().trim().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const createWorshipLevelSchema = z.object({
  body: levelBodySchema,
});

export const updateWorshipLevelSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: levelBodySchema.partial().refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required',
  }),
});

export const worshipLevelIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const assignWorshipLevelSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    userIds: z.array(z.string().uuid()).min(1, 'At least one user is required').max(50),
  }).strict(),
});

export const listAssignableWorshipLevelUsersSchema = z.object({
  query: z.object({
    search: z.string().trim().min(1).optional(),
  }).optional(),
});

export const userCustomScheduleSchema = z.object({
  params: z.object({
    userId: z.string().uuid(),
  }),
});

export const updateUserCustomScheduleSchema = z.object({
  params: z.object({
    userId: z.string().uuid(),
  }),
  body: z.object({
    customItemIds: z.array(z.string().uuid()).max(200).optional(),
    excludedItemIds: z.array(z.string().uuid()).max(200).optional(),
  }).strict(),
});
