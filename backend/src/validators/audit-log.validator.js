import { z } from 'zod';

const uuid = z.string().uuid();
const dateTime = z.string().datetime();

export const listAuditLogsSchema = z.object({
  params: z.object({}).optional(),
  query: z.object({
    actorId: uuid.optional(),
    targetType: z.string().trim().min(1).optional(),
    targetId: z.string().trim().min(1).optional(),
    action: z.string().trim().min(1).optional(),
    regionId: uuid.optional(),
    dateFrom: dateTime.optional(),
    dateTo: dateTime.optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }).optional(),
  body: z.object({}).optional(),
});
