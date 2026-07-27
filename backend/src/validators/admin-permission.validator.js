import { z } from 'zod';

export const rolePermissionParamsSchema = z.object({
  params: z.object({
    roleId: z.string().uuid(),
  }),
});

export const updateRolePermissionsSchema = z.object({
  params: z.object({
    roleId: z.string().uuid(),
  }),
  body: z.object({
    permissions: z.array(z.string().trim().min(1)).default([]),
  }).strict(),
});
