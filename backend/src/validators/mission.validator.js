import { z } from 'zod';

const paginationQuerySchema = {
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
};

export const listMissionsSchema = z.object({
  query: z.object({
    ...paginationQuerySchema,
    search: z.string().trim().optional(),
    isActive: z.enum(['true', 'false']).optional(),
    mine: z.enum(['true', 'false']).optional(),
  }).optional(),
});

export const missionParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const assignableMissionUsersSchema = z.object({
  query: z.object({
    search: z.string().trim().optional(),
    limit: z.coerce.number().int().min(1).max(20).optional(),
  }).optional(),
});

export const createMissionSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1, 'Title is required'),
    description: z.string().trim().nullable().optional(),
    bonusXP: z.coerce.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  }).strict(),
});

export const updateMissionSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    title: z.string().trim().min(1).optional(),
    description: z.string().trim().nullable().optional(),
    bonusXP: z.coerce.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  }).strict(),
});

export const assignMissionSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    userId: z.string().uuid(),
  }).strict(),
});
