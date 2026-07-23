import { WorshipLevelService } from '#services/worship-level.service.js';
import { ApiResponse } from '#utils/apiResponse.js';

export class WorshipLevelController {
  static async findMany(req, res) {
    const levels = await WorshipLevelService.findMany({ includeInactive: req.query.all === 'true' });
    return ApiResponse.success(res, levels);
  }

  static async findById(req, res) {
    const level = await WorshipLevelService.findById(req.params.id);
    return ApiResponse.success(res, level);
  }

  static async create(req, res) {
    const level = await WorshipLevelService.create(req.body);
    return ApiResponse.created(res, level, 'Worship level created');
  }

  static async update(req, res) {
    const level = await WorshipLevelService.update(req.params.id, req.body);
    return ApiResponse.success(res, level, { message: 'Worship level updated' });
  }

  static async deactivate(req, res) {
    const level = await WorshipLevelService.deactivate(req.params.id);
    return ApiResponse.success(res, level, { message: 'Worship level deactivated' });
  }

  static async listAssignableUsers(req, res) {
    const users = await WorshipLevelService.findAssignableUsers({
      actor: req.user,
      permissions: req.permissions,
      search: req.query.search,
    });

    return ApiResponse.success(res, users);
  }

  static async assignUsers(req, res) {
    const assignments = await WorshipLevelService.assignUsers(req.params.id, req.body.userIds, {
      actor: req.user,
      permissions: req.permissions,
    });

    return ApiResponse.success(res, assignments, { message: 'Worship level assigned' });
  }

  static async getUserCustomSchedule(req, res) {
    const schedule = await WorshipLevelService.getUserCustomSchedule(req.params.userId, {
      actor: req.user,
      permissions: req.permissions,
    });

    return ApiResponse.success(res, schedule);
  }

  static async updateUserCustomSchedule(req, res) {
    const schedule = await WorshipLevelService.updateUserCustomSchedule(req.params.userId, req.body, {
      actor: req.user,
      permissions: req.permissions,
    });

    return ApiResponse.success(res, schedule, { message: 'Worship schedule customized' });
  }
}
