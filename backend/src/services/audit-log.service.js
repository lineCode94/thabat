import { PAGINATION } from '#constants/index.js';
import { prisma } from '#lib/prisma.js';

export function buildChangedFieldsDiff(before = {}, after = {}, fields = []) {
  return fields.reduce((diff, field) => {
    if (!Object.prototype.hasOwnProperty.call(after, field)) {
      return diff;
    }

    const from = before?.[field] ?? null;
    const to = after?.[field] ?? null;

    if (from !== to) {
      diff[field] = { from, to };
    }

    return diff;
  }, {});
}

export class AuditLogService {
  static async record({ actorId = null, action, targetType, targetId = null, regionId = null, metadata = null }) {
    const actor = actorId
      ? await prisma.user.findUnique({
        where: { id: actorId },
        select: { id: true, fullName: true, email: true },
      })
      : null;

    return prisma.auditLog.create({
      data: {
        actorId: actor?.id ?? null,
        actorSnapshotId: actor?.id ?? actorId,
        actorSnapshotName: actor?.fullName ?? null,
        actorSnapshotEmail: actor?.email ?? null,
        action,
        targetType,
        targetId,
        regionId,
        metadata,
      },
    });
  }

  static buildWhere(filters = {}) {
    return {
      ...(filters.actorId ? { actorId: filters.actorId } : {}),
      ...(filters.targetType ? { targetType: filters.targetType } : {}),
      ...(filters.targetId ? { targetId: filters.targetId } : {}),
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.regionId ? { regionId: filters.regionId } : {}),
      ...((filters.dateFrom || filters.dateTo) ? {
        createdAt: {
          ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
          ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
        },
      } : {}),
    };
  }

  static async findMany({ filters = {}, pagination = {} } = {}) {
    const page = pagination.page ?? PAGINATION.DEFAULT_PAGE;
    const limit = Math.min(pagination.limit ?? PAGINATION.DEFAULT_LIMIT, PAGINATION.MAX_LIMIT);
    const skip = (page - 1) * limit;
    const where = this.buildWhere(filters);

    const [total, auditLogs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      auditLogs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
