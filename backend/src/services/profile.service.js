import { hashPassword, verifyPassword } from '#lib/hash.js';
import { prisma } from '#lib/prisma.js';
import { UserRepository } from '#repositories/user.repository.js';
import { ApiError } from '#utils/apiError.js';

export class ProfileService {
  static async getProfile(userId) {
    const user = await UserRepository.findById(userId);
    if (!user) throw ApiError.notFound('User not found');
    
    // Omit sensitive data
    const safeUser = { ...user };
    delete safeUser.passwordHash;
    return safeUser;
  }

  static async updateProfile(userId, data) {
    const { notificationPreferences, ...userData } = data;

    // Update notification preferences if provided
    if (notificationPreferences) {
      await prisma.notificationPreference.upsert({
        where: { userId },
        create: {
          userId,
          ...notificationPreferences,
        },
        update: {
          ...notificationPreferences,
        }
      });
    }

    // Update user personal info
    if (Object.keys(userData).length > 0) {
      await UserRepository.update(userId, userData);
    }

    return this.getProfile(userId);
  }

  static async changePassword(userId, { currentPassword, newPassword }) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound('User not found');

    const isValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      throw ApiError.badRequest('Incorrect current password');
    }

    const newPasswordHash = await hashPassword(newPassword);
    await UserRepository.update(userId, { passwordHash: newPasswordHash });
  }
}
