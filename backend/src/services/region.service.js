import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from '#constants/auditLog.js';
import { RegionRepository } from '#repositories/region.repository.js';
import { AuditLogService, buildChangedFieldsDiff } from '#services/audit-log.service.js';
import { ApiError } from '#utils/apiError.js';

export class RegionService {
  static buildScopedWhere(scopeRegionId = null, includeInactive = false) {
    return {
      ...(scopeRegionId ? { id: scopeRegionId } : {}),
      ...(includeInactive ? {} : { deletedAt: null }),
    };
  }

  static async findMany({ scopeRegionId = null, includeInactive = false } = {}) {
    const regions = await RegionRepository.findMany({
      where: this.buildScopedWhere(scopeRegionId, includeInactive),
    });
    const counts = await RegionRepository.countUsersByRegionIds(regions.map((region) => region.id));
    const countByRegionId = new Map(
      counts.map((count) => [count.regionId, count._count.id]),
    );

    return regions.map((region) => ({
      ...region,
      userCount: countByRegionId.get(region.id) ?? 0,
    }));
  }

  static async findById(id, { includeInactive = false } = {}) {
    const region = await RegionRepository.findById(id);

    if (!region || (!includeInactive && region.deletedAt)) {
      throw ApiError.notFound('Region not found');
    }

    const usersCount = await RegionRepository.countUsers(id);

    return {
      ...region,
      userCount: usersCount,
    };
  }

  static async create(data, { actorId = null } = {}) {
    try {
      const region = await RegionRepository.create(data);

      await AuditLogService.record({
        actorId,
        action: AUDIT_ACTIONS.REGION_CREATED,
        targetType: AUDIT_TARGET_TYPES.REGION,
        targetId: region.id,
        regionId: region.id,
        metadata: {
          name: region.name,
          description: region.description,
        },
      });

      return region;
    } catch (error) {
      if (error.code === 'P2002') {
        throw ApiError.conflict('Region name already exists', 'REGION_NAME_EXISTS');
      }
      throw error;
    }
  }

  static async update(id, data, { actorId = null } = {}) {
    const before = await this.findById(id);

    try {
      const region = await RegionRepository.update(id, data);
      const changes = buildChangedFieldsDiff(before, region, ['name', 'description', 'isActive']);

      if (Object.keys(changes).length > 0) {
        await AuditLogService.record({
          actorId,
          action: AUDIT_ACTIONS.REGION_UPDATED,
          targetType: AUDIT_TARGET_TYPES.REGION,
          targetId: region.id,
          regionId: region.id,
          metadata: { changes },
        });
      }

      return region;
    } catch (error) {
      if (error.code === 'P2002') {
        throw ApiError.conflict('Region name already exists', 'REGION_NAME_EXISTS');
      }
      throw error;
    }
  }

  static async softDelete(id, { actorId = null } = {}) {
    const before = await this.findById(id);

    const usersCount = await RegionRepository.countUsers(id);
    if (usersCount > 0) {
      throw ApiError.conflict(
        'Cannot delete a region that still has users',
        'REGION_HAS_USERS',
        { usersCount },
      );
    }

    const region = await RegionRepository.softDelete(id);

    await AuditLogService.record({
      actorId,
      action: AUDIT_ACTIONS.REGION_DEACTIVATED,
      targetType: AUDIT_TARGET_TYPES.REGION,
      targetId: region.id,
      regionId: region.id,
      metadata: {
        name: before.name,
        deletedAt: region.deletedAt,
      },
    });

    return region;
  }
}
