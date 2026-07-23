import { z } from 'zod';

const booleanQuery = z.enum(['true', 'false']).transform((value) => value === 'true');

export const listAdminUsersSchema = z.object({
  query: z.object({
    regionId: z.string().uuid().optional(),
    role: z.string().trim().min(1).optional(),
    mentorId: z.string().uuid().optional(),
    isActive: booleanQuery.optional(),
    search: z.string().trim().min(1).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }).optional(),
});

export const adminUserParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const createAdminUserSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(2, 'Full name must be at least 2 characters'),
    email: z.string().trim().email('Invalid email address'),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    roleId: z.string().uuid(),
    regionId: z.string().uuid(),
    phone: z.string().trim().optional(),
    avatarUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
    timezone: z.string().trim().optional(),
    isActive: z.boolean().optional(),
  }).strict(),
});

export const updateAdminUserSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    fullName: z.string().trim().min(2).optional(),
    email: z.string().trim().email('Invalid email address').optional(),
    roleId: z.string().uuid().optional(),
    regionId: z.string().uuid().optional(),
    phone: z.string().trim().nullable().optional(),
    avatarUrl: z.string().url('Invalid URL').nullable().optional().or(z.literal('')),
    timezone: z.string().trim().optional(),
    isActive: z.boolean().optional(),
  }).strict(),
});

export const transferRegionSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    regionId: z.string().uuid(),
  }).strict(),
});
