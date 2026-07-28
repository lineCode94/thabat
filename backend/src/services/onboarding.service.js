import {
  MENTOR_ASSIGNMENT_STATUS,
  PENDING_SETUP_REGION_NAME,
  TODAY_WORSHIP_READINESS,
} from '#constants/onboarding.js';
import { ROLES } from '#constants/permissionRegistry.js';
import { prisma } from '#lib/prisma.js';
import { ApiError } from '#utils/apiError.js';
import { getThabatDateForTimezone } from '#utils/week.js';

function isPendingSetupRegion(region) {
  return region?.name === PENDING_SETUP_REGION_NAME;
}

function getDayOfWeekForTimezone(timezone, date = new Date()) {
  return getThabatDateForTimezone(timezone || 'UTC', date).getUTCDay();
}

function isItemAvailableToday(item, dayOfWeek) {
  return !item.daysOfWeek?.length || item.daysOfWeek.includes(dayOfWeek);
}

const RETIRED_DAILY_QURAN_ITEM_TITLES = new Set([
  'قراءة الورد/حزب',
  'تسميع القرآن',
  'مراجعة/حفظ قرآن جديد',
]);

const DEFAULT_DAILY_WORSHIP_CATALOG = [
  {
    name: 'Fajr',
    items: [
      ['السنة القبلية', 2, 'BOOLEAN'],
      ['الدعاء بين الأذانين', 2, 'BOOLEAN'],
      ['تكبيرة الإحرام', 2, 'BOOLEAN'],
      ['الجماعة الأولى (الفجر)', 5, 'BOOLEAN'],
      ['أذكار بعد الصلاة', 2, 'BOOLEAN'],
      ['أذكار الصباح', 2, 'BOOLEAN'],
    ],
  },
  {
    name: 'أذكار وأعمال يومية',
    items: [
      ['الاستيقاظ', 1, 'BOOLEAN'],
      ['الخلاء', 1, 'BOOLEAN'],
      ['لبس الثوب وخلعه', 1, 'BOOLEAN'],
      ['الوضوء', 1, 'BOOLEAN'],
      ['دخول/خروج المنزل', 1, 'BOOLEAN'],
      ['دخول/خروج المسجد', 1, 'BOOLEAN'],
      ['المشي للمسجد', 1, 'BOOLEAN'],
      ['الأكل والشرب', 1, 'BOOLEAN'],
      ['الركوب', 1, 'BOOLEAN'],
      ['النوم', 1, 'BOOLEAN'],
      ['الاستغفار 100', 2, 'COUNT', 100],
      ['حضور دروس العلم -السبت والخميس-', 5, 'BOOLEAN'],
      ['مذاكرة دروس العلم', 5, 'BOOLEAN'],
      ['بر الوالدين', 5, 'BOOLEAN'],
      ['مذاكرة الدراسة أو إتقان العمل 5 ساعات', 5, 'BOOLEAN'],
      ['دعوة', 2, 'BOOLEAN'],
    ],
  },
  {
    name: 'الظهر',
    items: [
      ['صلاة الضحى', 2, 'BOOLEAN'],
      ['السنة القبلية 4 ركعات', 2, 'BOOLEAN'],
      ['الجماعة الأولى أو الجمعة (الظهر)', 5, 'BOOLEAN'],
      ['أذكار بعد الصلاة', 2, 'BOOLEAN'],
      ['السنة البعدية', 2, 'BOOLEAN'],
      ['ركعتين حرمهما الله على النار', 2, 'BOOLEAN'],
    ],
  },
  {
    name: 'العصر',
    items: [
      ['4 ركعات قبل', 2, 'BOOLEAN'],
      ['الجماعة الأولى (العصر)', 5, 'BOOLEAN'],
      ['أذكار بعد الصلاة', 2, 'BOOLEAN'],
      ['أذكار المساء', 2, 'BOOLEAN'],
    ],
  },
  {
    name: 'المغرب',
    items: [
      ['الجماعة الأولى (المغرب)', 5, 'BOOLEAN'],
      ['أذكار بعد الصلاة', 2, 'BOOLEAN'],
      ['السنة البعدية', 2, 'BOOLEAN'],
    ],
  },
  {
    name: 'العشاء',
    items: [
      ['الجماعة الأولى (العشاء)', 5, 'BOOLEAN'],
      ['أذكار بعد الصلاة', 2, 'BOOLEAN'],
      ['السنة البعدية', 2, 'BOOLEAN'],
    ],
  },
  {
    name: 'الليل',
    items: [
      ['القيام ركعتين', 4, 'BOOLEAN'],
      ['الوتر', 1, 'BOOLEAN'],
      ['دعاء الوتر', 2, 'BOOLEAN'],
    ],
  },
  {
    name: 'أذكار وأعمال صالحة',
    items: [
      ['التسبيح والتهليل 100', 2, 'COUNT', 100],
      ['الصلاة على النبي 100', 2, 'COUNT', 100],
      ['حضور المقرأة', 2, 'BOOLEAN'],
      ['طلب العلم', 2, 'BOOLEAN'],
    ],
  },
  {
    name: 'أعمال الجمعة',
    daysOfWeek: [5],
    items: [
      ['التبكير/15 دقيقة', 1, 'BOOLEAN'],
      ['سورة الكهف', 1, 'BOOLEAN'],
      ['الصلاة على النبي', 1, 'BOOLEAN'],
      ['الغسل', 1, 'BOOLEAN'],
      ['التطيب', 1, 'BOOLEAN'],
      ['لبس أفضل الثياب', 1, 'BOOLEAN'],
      ['سنن الفطرة', 1, 'BOOLEAN'],
      ['الدعاء قبل المغرب', 1, 'BOOLEAN'],
    ],
  },
];

export class OnboardingService {
  static async getLowestActiveWorshipLevel(client = prisma) {
    return client.worshipLevel.findFirst({
      where: { isActive: true, deletedAt: null },
      orderBy: { order: 'asc' },
    });
  }

  static async ensurePendingSetupRegion(client = prisma) {
    return client.region.upsert({
      where: { name: PENDING_SETUP_REGION_NAME },
      update: {
        isActive: true,
        deletedAt: null,
        description: 'System region for self-registered users awaiting authorized setup.',
      },
      create: {
        name: PENDING_SETUP_REGION_NAME,
        description: 'System region for self-registered users awaiting authorized setup.',
        isActive: true,
      },
    });
  }

  static async createNormalUserOnboarding({ userId }, client = prisma) {
    const defaultLevel = await this.getLowestActiveWorshipLevel(client);
    if (!defaultLevel) {
      throw ApiError.conflict(
        'Registration is temporarily unavailable because no active Worship Level is configured.',
        'NO_ACTIVE_WORSHIP_LEVEL',
      );
    }

    await client.userLevel.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    const userLevel = await client.userLevel.create({
      data: {
        userId,
        levelId: defaultLevel.id,
        isActive: true,
      },
      include: {
        worshipLevel: true,
      },
    });

    return userLevel;
  }

  static async getActiveUserLevel(userId, client = prisma) {
    return client.userLevel.findFirst({
      where: {
        userId,
        isActive: true,
        worshipLevel: {
          isActive: true,
          deletedAt: null,
        },
      },
      include: {
        worshipLevel: true,
      },
      orderBy: [
        { assignedAt: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  static async ensureActiveUserLevel(user, client = prisma) {
    const activeUserLevel = await this.getActiveUserLevel(user.id, client);
    if (activeUserLevel) {
      return activeUserLevel;
    }

    return this.createNormalUserOnboarding({ userId: user.id }, client);
  }

  static async ensureDefaultWorshipCatalog(client = prisma) {
    const expectedItemCount = DEFAULT_DAILY_WORSHIP_CATALOG.reduce(
      (total, category) => total + category.items.length,
      0,
    );
    const activeCatalogCategories = await client.worshipCategory.count({
      where: {
        isActive: true,
        deletedAt: null,
        name: { in: DEFAULT_DAILY_WORSHIP_CATALOG.map((category) => category.name) },
      },
    });
    const activeCatalogItems = await client.worshipItem.count({
      where: {
        isActive: true,
        deletedAt: null,
        title: {
          in: DEFAULT_DAILY_WORSHIP_CATALOG.flatMap((category) => (
            category.items.map((item) => item[0])
          )),
        },
        category: {
          isActive: true,
          deletedAt: null,
          name: { in: DEFAULT_DAILY_WORSHIP_CATALOG.map((category) => category.name) },
        },
      },
    });

    if (
      activeCatalogCategories === DEFAULT_DAILY_WORSHIP_CATALOG.length
      && activeCatalogItems >= expectedItemCount
    ) {
      return;
    }

    for (const [categoryIndex, category] of DEFAULT_DAILY_WORSHIP_CATALOG.entries()) {
      const savedCategory = await client.worshipCategory.upsert({
        where: { name: category.name },
        update: {
          order: categoryIndex + 1,
          isActive: true,
          deletedAt: null,
        },
        create: {
          name: category.name,
          order: categoryIndex + 1,
          isActive: true,
        },
      });

      for (const [itemIndex, item] of category.items.entries()) {
        const [title, score, inputType, targetValue = null] = item;
        const existingItem = await client.worshipItem.findFirst({
          where: {
            categoryId: savedCategory.id,
            title,
          },
        });
        const data = {
          title,
          inputType,
          targetType: inputType.toLowerCase(),
          targetValue,
          daysOfWeek: category.daysOfWeek ?? [],
          order: ((categoryIndex + 1) * 100) + itemIndex + 1,
          score,
          xp: score,
          isActive: true,
          deletedAt: null,
        };

        if (existingItem) {
          await client.worshipItem.update({
            where: { id: existingItem.id },
            data,
          });
        } else {
          await client.worshipItem.create({
            data: {
              categoryId: savedCategory.id,
              ...data,
            },
          });
        }
      }
    }
  }

  static async ensureDefaultLevelRequirements(worshipLevel, client = prisma) {
    if (!worshipLevel || worshipLevel.order !== 1) {
      return;
    }

    await this.ensureDefaultWorshipCatalog(client);

    const [activeItems, currentRequirements] = await Promise.all([
      client.worshipItem.findMany({
        where: {
          isActive: true,
          deletedAt: null,
          category: {
            isActive: true,
            deletedAt: null,
          },
        },
        select: { id: true, title: true },
      }),
      client.levelRequirement.findMany({
        where: { levelId: worshipLevel.id },
        select: {
          worshipItemId: true,
          worshipItem: {
            select: { title: true },
          },
        },
      }),
    ]);

    const expectedItems = activeItems.filter((item) => !RETIRED_DAILY_QURAN_ITEM_TITLES.has(item.title));
    const currentItemIds = new Set(currentRequirements.map((requirement) => requirement.worshipItemId));
    const hasRetiredDailyQuranRequirement = currentRequirements.some((requirement) => (
      RETIRED_DAILY_QURAN_ITEM_TITLES.has(requirement.worshipItem?.title)
    ));
    const hasMissingExpectedRequirement = expectedItems.some((item) => !currentItemIds.has(item.id));

    if (!hasRetiredDailyQuranRequirement && !hasMissingExpectedRequirement) {
      return;
    }

    await client.$transaction(async (tx) => {
      await tx.levelRequirement.deleteMany({
        where: { levelId: worshipLevel.id },
      });

      if (expectedItems.length > 0) {
        await tx.levelRequirement.createMany({
          data: expectedItems.map((item) => ({
            levelId: worshipLevel.id,
            worshipItemId: item.id,
          })),
          skipDuplicates: true,
        });
      }
    });
  }

  static async getMentorAssignmentStatus(userId, client = prisma) {
    const assignment = await client.mentorAssignment.findFirst({
      where: { userId, isActive: true },
      select: { id: true },
    });

    return assignment ? MENTOR_ASSIGNMENT_STATUS.ASSIGNED : MENTOR_ASSIGNMENT_STATUS.PENDING;
  }

  static async getUserSessionContext(userId, client = prisma) {
    const user = await client.user.findUnique({
      where: { id: userId },
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

    if (!user) {
      return null;
    }

    const activeUserLevel = await this.ensureActiveUserLevel(user, client);
    const mentorAssignmentStatus = user.role?.code === ROLES.USER
      ? await this.getMentorAssignmentStatus(userId, client)
      : null;

    return this.toSessionUser(user, activeUserLevel, mentorAssignmentStatus);
  }

  static toSessionUser(user, activeUserLevel = null, mentorAssignmentStatus = null) {
    const sessionUser = { ...user };
    delete sessionUser.passwordHash;
    delete sessionUser.userLevels;
    delete sessionUser.mentorAssignmentsAsStudent;

    sessionUser.worshipLevel = activeUserLevel?.worshipLevel
      ? {
          id: activeUserLevel.worshipLevel.id,
          name: activeUserLevel.worshipLevel.name,
          order: activeUserLevel.worshipLevel.order,
        }
      : null;

    sessionUser.mentorAssignmentStatus = mentorAssignmentStatus;

    return sessionUser;
  }

  static async resolveTodayWorshipReadiness(userId, client = prisma, date = new Date()) {
    const user = await client.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        region: true,
      },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const activeUserLevel = await this.ensureActiveUserLevel(user, client);
    await this.ensureDefaultLevelRequirements(activeUserLevel?.worshipLevel, client);

    // Allow users to see default daily worship even if they are in PENDING_SETUP
    // if (user.role?.code === ROLES.USER && user.onboardingStatus !== ONBOARDING_STATUS.ACTIVE) {
    //   return {
    //     ready: false,
    //     reason: TODAY_WORSHIP_READINESS.ONBOARDING_INCOMPLETE,
    //     worshipLevel: activeUserLevel?.worshipLevel ?? null,
    //     items: [],
    //   };
    // }

    if (!activeUserLevel) {
      return {
        ready: false,
        reason: TODAY_WORSHIP_READINESS.NO_ACTIVE_WORSHIP_LEVEL,
        worshipLevel: null,
        items: [],
      };
    }

    const [requirements, customRequirements, excludedRequirements] = await Promise.all([
      client.levelRequirement.findMany({
        where: { levelId: activeUserLevel.levelId },
        include: {
          worshipItem: {
            include: { category: true },
          },
        },
        orderBy: {
          worshipItem: { order: 'asc' },
        },
      }),
      client.userCustomRequirement.findMany({
        where: { userId },
        include: {
          worshipItem: {
            include: { category: true },
          },
        },
        orderBy: {
          worshipItem: { order: 'asc' },
        },
      }),
      client.userExcludedRequirement.findMany({
        where: { userId },
        select: { worshipItemId: true },
      }),
    ]);

    if (requirements.length === 0 && customRequirements.length === 0) {
      return {
        ready: false,
        reason: TODAY_WORSHIP_READINESS.NO_LEVEL_REQUIREMENTS,
        worshipLevel: activeUserLevel.worshipLevel,
        items: [],
      };
    }

    const excludedItemIds = new Set(excludedRequirements.map((requirement) => requirement.worshipItemId));
    const itemsById = new Map();

    requirements.forEach((requirement) => {
      const item = requirement.worshipItem;
      if (item && !excludedItemIds.has(item.id)) {
        itemsById.set(item.id, item);
      }
    });

    customRequirements.forEach((requirement) => {
      const item = requirement.worshipItem;
      if (item) {
        itemsById.set(item.id, item);
      }
    });

    const dayOfWeek = getDayOfWeekForTimezone(user.timezone, date);
    const configuredItems = [...itemsById.values()]
      .filter((item) => (
        item?.isActive
        && !item.deletedAt
        && item.category?.isActive
        && !item.category?.deletedAt
        && isItemAvailableToday(item, dayOfWeek)
      ))
      .sort((first, second) => {
        const categoryOrder = (first.category?.order ?? 0) - (second.category?.order ?? 0);
        if (categoryOrder !== 0) return categoryOrder;
        return (first.order ?? 0) - (second.order ?? 0);
      });

    if (configuredItems.length === 0) {
      return {
        ready: false,
        reason: TODAY_WORSHIP_READINESS.NO_WORSHIP_ITEMS_CONFIGURED,
        worshipLevel: activeUserLevel.worshipLevel,
        items: [],
      };
    }

    return {
      ready: true,
      reason: TODAY_WORSHIP_READINESS.READY,
      worshipLevel: activeUserLevel.worshipLevel,
      items: configuredItems,
      isPendingSetupRegion: isPendingSetupRegion(user.region),
    };
  }
}
