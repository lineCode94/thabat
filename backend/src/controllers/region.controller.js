import { PERMISSIONS } from '#constants/permissionRegistry.js';
import { AuthorizationService } from '#services/authorization.service.js';
import { RegionService } from '#services/region.service.js';
import { ApiError } from '#utils/apiError.js';
import { ApiResponse } from '#utils/apiResponse.js';

function resolveScopeRegionId(req) {
  if (AuthorizationService.canManageRegions(req)) {
    return null;
  }

  return req.user.regionId;
}

function assertRegionInScope(req, regionId) {
  const scopeRegionId = resolveScopeRegionId(req);

  if (scopeRegionId && scopeRegionId !== regionId) {
    throw ApiError.forbidden('Cannot access regions outside your scope');
  }

  return scopeRegionId;
}

export class RegionController {
  static async getRegions(req, res) {
    const scopeRegionId = resolveScopeRegionId(req);
    const includeInactive = AuthorizationService.canManageRegions(req) && req.query?.all === 'true';
    const regions = await RegionService.findMany({ scopeRegionId, includeInactive });

    return ApiResponse.success(res, regions);
  }

  static async getRegionById(req, res) {
    assertRegionInScope(req, req.params.id);
    const includeInactive = AuthorizationService.canManageRegions(req) && req.query?.all === 'true';
    const region = await RegionService.findById(req.params.id, { includeInactive });

    return ApiResponse.success(res, region);
  }

  static async createRegion(req, res) {
    const region = await RegionService.create(req.body, { actorId: req.user.id });

    return ApiResponse.created(res, region, 'Region created');
  }

  static async updateRegion(req, res) {
    const region = await RegionService.update(req.params.id, req.body, { actorId: req.user.id });

    return ApiResponse.success(res, region, { message: 'Region updated' });
  }

  static async deleteRegion(req, res) {
    const region = await RegionService.softDelete(req.params.id, { actorId: req.user.id });

    return ApiResponse.success(res, region, { message: 'Region deleted' });
  }
}

export const REGION_READ_PERMISSIONS = [
  PERMISSIONS.REGIONS_MANAGE,
  PERMISSIONS.REGIONS_VIEW_OWN,
];
