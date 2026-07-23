import { z } from 'zod';

const booleanQuery = z.enum(['true', 'false']).transform((value) => value === 'true');

export const listMentorAssignmentsSchema = z.object({
  query: z.object({
    mentorId: z.string().uuid().optional(),
    userId: z.string().uuid().optional(),
    regionId: z.string().uuid().optional(),
    includeInactive: booleanQuery.optional(),
  }).optional(),
});

export const listMentorsSchema = z.object({
  query: z.object({
    regionId: z.string().uuid().optional(),
    search: z.string().trim().min(1).optional(),
  }).optional(),
});

export const mentorParamsSchema = z.object({
  params: z.object({
    mentorId: z.string().uuid(),
  }),
});

export const mentorUsersParamsSchema = z.object({
  params: z.object({
    mentorId: z.string().uuid(),
  }),
});

export const userMentorAssignmentParamsSchema = z.object({
  params: z.object({
    userId: z.string().uuid(),
  }),
});

export const mentorAssignmentParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

export const createMentorAssignmentSchema = z.object({
  body: z.object({
    userId: z.string().uuid(),
    mentorId: z.string().uuid(),
  }).strict(),
});

export const transferMentorAssignmentSchema = z.object({
  params: z.object({
    userId: z.string().uuid(),
  }),
  body: z.object({
    mentorId: z.string().uuid(),
  }).strict(),
});
