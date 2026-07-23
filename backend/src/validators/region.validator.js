import { z } from 'zod';

export const regionParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  query: z.object({
    all: z.enum(['true', 'false']).optional(),
  }).optional(),
});

export const listRegionsSchema = z.object({
  query: z.object({
    all: z.enum(['true', 'false']).optional(),
  }).optional(),
});

export const createRegionSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Name is required'),
    description: z.string().trim().optional(),
    isActive: z.boolean().optional(),
  }).strict(),
});

export const updateRegionSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().trim().min(1).optional(),
    description: z.string().trim().nullable().optional(),
    isActive: z.boolean().optional(),
  }).strict(),
});
