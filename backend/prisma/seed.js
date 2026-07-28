import { ONBOARDING_STATUS, PENDING_SETUP_REGION_NAME } from '../src/constants/onboarding.js';
import { ROLES } from '../src/constants/permissionRegistry.js';
import { env, isProduction } from '../src/config/env.js';
import { hashPassword } from '../src/lib/hash.js';
import { prisma } from '../src/lib/prisma.js';
import { PermissionService } from '../src/services/permission.service.js';

const DEV_ADMIN_EMAIL = 'admin@gmail.com';
const DEV_ADMIN_PASSWORD = 'Islamic--12345';
const DEVELOPMENT_REGION_NAME = 'Development Region';
const FIRST_WORSHIP_LEVEL = {
  order: 1,
  name: 'المستوى الأول',
  description: 'المستوى الأساسي الذي يحتوي على كل عناصر شيت المتابعة الحالي.',
};
const FRIDAY = 5;
const MOJIBAKE_PATTERN = /[ØÙ]/;
const REMOVED_DAILY_QURAN_ITEM_TITLES = [
  'قراءة الورد/حزب',
  'تسميع القرآن',
  'مراجعة/حفظ قرآن جديد',
];
const RETIRED_DAILY_QURAN_BADGE_KEYS = [
  'daily_wird_recitation',
  'daily_quran_memorization',
  'weekly_wird_consistency',
  'quran_recitation_review',
  'monthly_wird_consistency',
  'monthly_quran_recitation_review',
  'quran_khatm_604_pages',
];
const QURAN_BADGES = [
  {
    key: 'quran_weekly_consistency',
    name: 'ثبات المراجعة الأسبوعية',
    description: 'سجل تقدم القرآن أسبوعين متتاليين دون انقطاع.',
    category: 'Quran',
    rarity: 'Rare',
    isVisible: true,
    condition: { type: 'quran', metric: 'weekly_log_streak', threshold: 2 },
    sortOrder: 151,
  },
  {
    key: 'quran_memorized_10_juz',
    name: 'حافظ 10 أجزاء',
    description: 'وصل إجمالي الحفظ إلى 10 أجزاء.',
    category: 'Quran',
    rarity: 'Rare',
    isVisible: true,
    condition: { type: 'quran', metric: 'cumulative_juz_memorized', threshold: 10 },
    sortOrder: 152,
  },
  {
    key: 'quran_memorized_15_juz',
    name: 'نصف القرآن',
    description: 'وصل إجمالي الحفظ إلى 15 جزءًا.',
    category: 'Quran',
    rarity: 'Epic',
    isVisible: true,
    condition: { type: 'quran', metric: 'cumulative_juz_memorized', threshold: 15 },
    sortOrder: 153,
  },
  {
    key: 'quran_memorized_20_juz',
    name: 'حافظ 20 جزءًا',
    description: 'وصل إجمالي الحفظ إلى 20 جزءًا.',
    category: 'Quran',
    rarity: 'Epic',
    isVisible: true,
    condition: { type: 'quran', metric: 'cumulative_juz_memorized', threshold: 20 },
    sortOrder: 154,
  },
  {
    key: 'quran_memorized_30_juz',
    name: 'ختم حفظ القرآن',
    description: 'أكمل حفظ القرآن كاملًا.',
    category: 'Quran',
    rarity: 'Legendary',
    isVisible: true,
    condition: { type: 'quran', metric: 'cumulative_juz_memorized', threshold: 30 },
    sortOrder: 155,
  },
];

function normalizeSeedText(value) {
  if (typeof value !== 'string' || !MOJIBAKE_PATTERN.test(value)) {
    return value;
  }

  return Buffer.from(value, 'latin1').toString('utf8');
}

function normalizeSeedItemTuple(item) {
  return item.map((value, index) => (index === 0 ? normalizeSeedText(value) : value));
}

const MENTOR_WORSHIP_SHEET = [
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
    daysOfWeek: [FRIDAY],
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

async function ensureRbacRegistry() {
  await PermissionService.syncRegistry();

  await prisma.role.updateMany({
    where: { code: 'ADMIN' },
    data: { isActive: false },
  });

  return prisma.role.findUnique({
    where: { code: ROLES.SUPER_ADMIN },
  });
}

async function ensureDevelopmentRegion() {
  const developmentRegion = await prisma.region.upsert({
    where: { name: DEVELOPMENT_REGION_NAME },
    update: { isActive: true },
    create: {
      name: DEVELOPMENT_REGION_NAME,
      description: 'Default region for development seed accounts',
      isActive: true,
    },
  });

  await prisma.region.upsert({
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

  return developmentRegion;
}

async function seedDevelopmentAdmin() {
  if (isProduction && (!env.SEED_ADMIN_EMAIL && !env.SEED_ADMIN_PASSWORD)) {
    console.warn('Skipping seed admin in production because SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are not configured.');
    await ensureRbacRegistry();
    await ensureDevelopmentRegion();
    return;
  }

  if (isProduction && (!env.SEED_ADMIN_EMAIL || !env.SEED_ADMIN_PASSWORD)) {
    throw new Error('Both SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required to seed an admin in production.');
  }

  const isUsingFallbackDevAdmin = !env.SEED_ADMIN_EMAIL || !env.SEED_ADMIN_PASSWORD;
  const adminEmail = env.SEED_ADMIN_EMAIL ?? DEV_ADMIN_EMAIL;
  const adminPassword = env.SEED_ADMIN_PASSWORD ?? DEV_ADMIN_PASSWORD;

  if (!isProduction && isUsingFallbackDevAdmin) {
    console.warn('WARNING: Using default dev admin credentials - do not use in production.');
  }

  const [superAdminRole, developmentRegion] = await Promise.all([
    ensureRbacRegistry(),
    ensureDevelopmentRegion(),
  ]);

  const passwordHash = await hashPassword(adminPassword);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      roleId: superAdminRole.id,
      regionId: developmentRegion.id,
      onboardingStatus: ONBOARDING_STATUS.ACTIVE,
    },
    create: {
      fullName: 'Development Admin',
      email: adminEmail,
      passwordHash,
      roleId: superAdminRole.id,
      regionId: developmentRegion.id,
      onboardingStatus: ONBOARDING_STATUS.ACTIVE,
      isActive: true,
      timezone: 'Africa/Cairo',
    },
  });

  console.log(`Seed admin ensured: ${adminEmail} (${ROLES.SUPER_ADMIN})`);
}

async function seedWorshipLevels() {
  const firstWorshipLevel = {
    ...FIRST_WORSHIP_LEVEL,
    name: normalizeSeedText(FIRST_WORSHIP_LEVEL.name),
    description: normalizeSeedText(FIRST_WORSHIP_LEVEL.description),
  };

  const firstLevel = await prisma.worshipLevel.upsert({
    where: { order: firstWorshipLevel.order },
    update: {
      name: firstWorshipLevel.name,
      description: firstWorshipLevel.description,
      isActive: true,
      deletedAt: null,
    },
    create: {
      ...firstWorshipLevel,
      isActive: true,
    },
  });

  await prisma.worshipLevel.updateMany({
    where: {
      order: { notIn: [FIRST_WORSHIP_LEVEL.order, 2] },
    },
    data: {
      isActive: false,
      deletedAt: new Date(),
    },
  });

  return firstLevel;
}

function normalizeSeedItem(category, item, itemIndex) {
  const [title, points, inputType, targetValue = null] = normalizeSeedItemTuple(item);

  return {
    title,
    inputType,
    targetValue,
    categoryName: normalizeSeedText(category.name),
    daysOfWeek: category.daysOfWeek ?? [],
    order: (category.order * 100) + itemIndex,
    score: points,
    xp: points,
  };
}

async function assertWorshipReplacementIsSafe(sheetCategoryNames, sheetItemTitles) {
  const removedQuranTitles = REMOVED_DAILY_QURAN_ITEM_TITLES.map(normalizeSeedText);
  const trackedLegacyItems = await prisma.trackingEntry.findMany({
    where: {
      worshipItem: {
        title: { notIn: removedQuranTitles },
        OR: [
          { title: { notIn: sheetItemTitles } },
          { category: { name: { notIn: sheetCategoryNames } } },
        ],
      },
    },
    select: {
      worshipItem: {
        select: {
          title: true,
          category: { select: { name: true } },
        },
      },
      trackingDay: {
        select: {
          user: { select: { email: true } },
        },
      },
    },
    take: 5,
  });

  if (trackedLegacyItems.length > 0) {
    const examples = trackedLegacyItems
      .map((entry) => `${entry.trackingDay.user.email}: ${entry.worshipItem.category.name} / ${entry.worshipItem.title}`)
      .join('; ');
    console.warn(
      `Existing tracking references legacy worship items; preserving history and deactivating legacy items. Examples: ${examples}`,
    );
  }
}

async function upsertWorshipItem(categoryId, itemData) {
  const existingItem = await prisma.worshipItem.findFirst({
    where: {
      categoryId,
      title: itemData.title,
    },
  });

  const data = {
    title: itemData.title,
    inputType: itemData.inputType,
    targetType: itemData.inputType.toLowerCase(),
    targetValue: itemData.targetValue,
    daysOfWeek: itemData.daysOfWeek,
    order: itemData.order,
    score: itemData.score,
    xp: itemData.xp,
    isActive: true,
    deletedAt: null,
  };

  if (existingItem) {
    return prisma.worshipItem.update({
      where: { id: existingItem.id },
      data,
    });
  }

  return prisma.worshipItem.create({
    data: {
      categoryId,
      ...data,
    },
  });
}

async function seedMentorWorshipSheet() {
  const sheetCategories = MENTOR_WORSHIP_SHEET.map((category, index) => ({
    ...category,
    name: normalizeSeedText(category.name),
    order: index + 1,
  }));
  const sheetCategoryNames = sheetCategories.map((category) => category.name);
  const sheetItems = sheetCategories.flatMap((category) => (
    category.items.map((item, index) => normalizeSeedItem(category, item, index + 1))
  ));
  const sheetItemTitles = [...new Set(sheetItems.map((item) => item.title))];

  await assertWorshipReplacementIsSafe(sheetCategoryNames, sheetItemTitles);

  for (const category of sheetCategories) {
    const savedCategory = await prisma.worshipCategory.upsert({
      where: { name: category.name },
      update: {
        order: category.order,
        isActive: true,
        deletedAt: null,
      },
      create: {
        name: category.name,
        order: category.order,
        isActive: true,
      },
    });

    const categoryItems = sheetItems.filter((item) => item.categoryName === category.name);
    for (const item of categoryItems) {
      await upsertWorshipItem(savedCategory.id, item);
    }
  }

  await prisma.worshipItem.updateMany({
    where: {
      OR: [
        { title: { notIn: sheetItemTitles } },
        { category: { name: { notIn: sheetCategoryNames } } },
      ],
    },
    data: {
      isActive: false,
      deletedAt: new Date(),
    },
  });

  await prisma.worshipCategory.updateMany({
    where: { name: { notIn: sheetCategoryNames } },
    data: {
      isActive: false,
      deletedAt: new Date(),
    },
  });

  console.log(`Mentor worship sheet ensured: ${sheetCategories.length} categories, ${sheetItems.length} items`);
}

async function retireRemovedDailyQuranItems(firstLevel) {
  const removedTitles = REMOVED_DAILY_QURAN_ITEM_TITLES.map(normalizeSeedText);
  const removedItems = await prisma.worshipItem.findMany({
    where: { title: { in: removedTitles } },
    select: {
      id: true,
      title: true,
      _count: { select: { trackingEntries: true } },
    },
  });

  if (removedItems.length === 0) {
    console.log('No removed Quran daily tracking items found.');
    return;
  }

  const removedItemIds = removedItems.map((item) => item.id);

  await prisma.levelRequirement.deleteMany({
    where: {
      levelId: firstLevel.id,
      worshipItemId: { in: removedItemIds },
    },
  });

  const itemsWithHistory = removedItems.filter((item) => item._count.trackingEntries > 0);
  const itemsWithoutHistory = removedItems.filter((item) => item._count.trackingEntries === 0);

  if (itemsWithHistory.length > 0) {
    await prisma.worshipItem.updateMany({
      where: { id: { in: itemsWithHistory.map((item) => item.id) } },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });
  }

  if (itemsWithoutHistory.length > 0) {
    await prisma.worshipItem.deleteMany({
      where: { id: { in: itemsWithoutHistory.map((item) => item.id) } },
    });
  }

  console.log(`Retired Quran daily tracking items: ${itemsWithHistory.length} deactivated, ${itemsWithoutHistory.length} deleted`);
}

async function seedQuranBadges() {
  await prisma.badge.updateMany({
    where: {
      key: { in: RETIRED_DAILY_QURAN_BADGE_KEYS },
      deletedAt: null,
    },
    data: {
      isVisible: false,
      deletedAt: new Date(),
    },
  });

  for (const badge of QURAN_BADGES) {
    await prisma.badge.upsert({
      where: { key: badge.key },
      update: {
        name: badge.name,
        description: badge.description,
        category: badge.category,
        rarity: badge.rarity,
        isVisible: badge.isVisible,
        condition: badge.condition,
        sortOrder: badge.sortOrder,
        deletedAt: null,
      },
      create: badge,
    });
  }

  console.log(`Quran badges ensured: ${QURAN_BADGES.length} active, ${RETIRED_DAILY_QURAN_BADGE_KEYS.length} retired`);
}

async function seedFirstLevelRequirements(firstLevel) {
  const activeItems = await prisma.worshipItem.findMany({
    where: {
      isActive: true,
      deletedAt: null,
    },
    select: { id: true },
  });

  await prisma.levelRequirement.deleteMany({
    where: { levelId: firstLevel.id },
  });

  await prisma.levelRequirement.createMany({
    data: activeItems.map((item) => ({
      levelId: firstLevel.id,
      worshipItemId: item.id,
    })),
    skipDuplicates: true,
  });

  console.log(`First worship level requirements ensured: ${activeItems.length} items`);
}

async function repairDefaultUserWorshipLevels(firstLevel) {
  const usersNeedingDefaultLevelRepair = await prisma.user.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      role: { code: ROLES.USER },
      OR: [
        { userLevels: { none: { isActive: true } } },
        { onboardingStatus: ONBOARDING_STATUS.PENDING_SETUP },
        { region: { name: PENDING_SETUP_REGION_NAME } },
      ],
    },
    select: {
      id: true,
      userLevels: {
        select: {
          id: true,
          levelId: true,
          isActive: true,
          worshipLevel: {
            select: {
              id: true,
              order: true,
              isActive: true,
              deletedAt: true,
            },
          },
        },
        orderBy: [
          { assignedAt: 'desc' },
          { createdAt: 'desc' },
        ],
      },
    },
  });

  if (usersNeedingDefaultLevelRepair.length === 0) {
    console.log('No users needed default worship level repair.');
    return;
  }

  let repairedCount = 0;

  await prisma.$transaction(async (tx) => {
    for (const user of usersNeedingDefaultLevelRepair) {
      const activeLevels = user.userLevels.filter((userLevel) => userLevel.isActive);
      const activeDefaultLevel = activeLevels.find((userLevel) => userLevel.levelId === firstLevel.id);
      const hasOnlyActiveDefaultLevel = activeLevels.length === 1 && Boolean(activeDefaultLevel);

      if (hasOnlyActiveDefaultLevel) {
        await tx.userExcludedRequirement.deleteMany({
          where: { userId: user.id },
        });
        continue;
      }

      await tx.userLevel.updateMany({
        where: { userId: user.id, isActive: true },
        data: { isActive: false },
      });

      const existingDefaultLevel = user.userLevels.find((userLevel) => userLevel.levelId === firstLevel.id);

      if (existingDefaultLevel) {
        await tx.userLevel.update({
          where: { id: existingDefaultLevel.id },
          data: { isActive: true },
        });
      } else {
        await tx.userLevel.create({
          data: {
            userId: user.id,
            levelId: firstLevel.id,
            isActive: true,
          },
        });
      }

      await tx.userExcludedRequirement.deleteMany({
        where: { userId: user.id },
      });

      repairedCount += 1;
    }
  });

  console.log(`Default worship level repair ensured: ${repairedCount} users reassigned, ${usersNeedingDefaultLevelRepair.length} users scanned`);
}

async function main() {
  const firstLevel = await seedWorshipLevels();
  await seedMentorWorshipSheet();
  await retireRemovedDailyQuranItems(firstLevel);
  await seedFirstLevelRequirements(firstLevel);
  await seedQuranBadges();
  await seedDevelopmentAdmin();
  await repairDefaultUserWorshipLevels(firstLevel);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
