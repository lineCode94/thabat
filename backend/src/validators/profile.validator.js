import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
    phone: z.string().optional(),
    avatarUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
    timezone: z.string().optional(),
    notificationPreferences: z.object({
      email: z.boolean(),
      push: z.boolean(),
      inApp: z.boolean(),
    }).optional(),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
  }),
});
