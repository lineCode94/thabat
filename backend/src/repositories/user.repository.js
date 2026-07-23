import { prisma } from '#lib/prisma.js';

export class UserRepository {
  static async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
        region: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
    });
  }

  static async findById(id) {
    return prisma.user.findUnique({
      where: { id },
      include: { 
        role: true,
        region: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
        notificationPreference: true
      },
    });
  }

  static async findAdminById(id) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        region: true,
        userLevels: {
          where: { isActive: true },
          include: { worshipLevel: true },
          orderBy: [
            { assignedAt: 'desc' },
            { createdAt: 'desc' },
          ],
        },
        mentorAssignmentsAsStudent: {
          where: { isActive: true },
          include: {
            mentor: {
              select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });
  }

  static async findManyAdmin({ where, skip, take, orderBy = { createdAt: 'desc' } }) {
    return prisma.user.findMany({
      where,
      include: {
        role: true,
        region: true,
        userLevels: {
          where: { isActive: true },
          include: { worshipLevel: true },
        },
        mentorAssignmentsAsStudent: {
          where: { isActive: true },
          include: {
            mentor: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy,
      skip,
      take,
    });
  }

  static countAdmin(where) {
    return prisma.user.count({ where });
  }

  static async create(userData) {
    return prisma.user.create({
      data: userData,
    });
  }

  static async update(id, data) {
    return prisma.user.update({
      where: { id },
      data,
    });
  }
}
