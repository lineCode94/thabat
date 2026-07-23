import { ONBOARDING_STATUS, PENDING_SETUP_REGION_NAME } from '../src/constants/onboarding.js';
import { ROLES } from '../src/constants/permissionRegistry.js';
import { hashPassword } from '../src/lib/hash.js';
import { prisma } from '../src/lib/prisma.js';
import { PermissionService } from '../src/services/permission.service.js';

const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'Islamic--1234';
const DEVELOPMENT_REGION_NAME = 'Development Region';
const FIRST_WORSHIP_LEVEL = {
  order: 1,
  name: 'Ø§Ù„Ù…Ø³ØªÙˆÙ‰ Ø§Ù„Ø£ÙˆÙ„',
  description: 'Ø§Ù„Ù…Ø³ØªÙˆÙ‰ Ø§Ù„Ø£Ø³Ø§Ø³ÙŠ Ø§Ù„Ø°ÙŠ ÙŠØ­ØªÙˆÙŠ Ø¹Ù„Ù‰ ÙƒÙ„ Ø¹Ù†Ø§ØµØ± Ø´ÙŠØª Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ø§Ù„Ø­Ø§Ù„ÙŠ.',
};
const FRIDAY = 5;
const MENTOR_WORSHIP_SHEET = [
  {
    name: 'Fajr',
    items: [
      ['Ø§Ù„Ø³Ù†Ø© Ø§Ù„Ù‚Ø¨Ù„ÙŠØ©', 2, 'BOOLEAN'],
      ['Ø§Ù„Ø¯Ø¹Ø§Ø¡ Ø¨ÙŠÙ† Ø§Ù„Ø£Ø°Ø§Ù†ÙŠÙ†', 2, 'BOOLEAN'],
      ['ØªÙƒØ¨ÙŠØ±Ø© Ø§Ù„Ø¥Ø­Ø±Ø§Ù…', 2, 'BOOLEAN'],
      ['الجماعة الأولى (الفجر)', 5, 'BOOLEAN'],
      ['Ø£Ø°ÙƒØ§Ø± Ø¨Ø¹Ø¯ Ø§Ù„ØµÙ„Ø§Ø©', 2, 'BOOLEAN'],
      ['Ø£Ø°ÙƒØ§Ø± Ø§Ù„ØµØ¨Ø§Ø­', 2, 'BOOLEAN'],
      ['Ù…Ø±Ø§Ø¬Ø¹Ø©/Ø­ÙØ¸ Ù‚Ø±Ø¢Ù† Ø¬Ø¯ÙŠØ¯', 2, 'BOOLEAN'],
    ],
  },
  {
    name: 'Ø£Ø°ÙƒØ§Ø± ÙˆØ£Ø¹Ù…Ø§Ù„ ÙŠÙˆÙ…ÙŠØ©',
    items: [
      ['Ø§Ù„Ø§Ø³ØªÙŠÙ‚Ø§Ø¸', 1, 'BOOLEAN'],
      ['Ø§Ù„Ø®Ù„Ø§Ø¡', 1, 'BOOLEAN'],
      ['Ù„Ø¨Ø³ Ø§Ù„Ø«ÙˆØ¨ ÙˆØ®Ù„Ø¹Ù‡', 1, 'BOOLEAN'],
      ['Ø§Ù„ÙˆØ¶ÙˆØ¡', 1, 'BOOLEAN'],
      ['Ø¯Ø®ÙˆÙ„/Ø®Ø±ÙˆØ¬ Ø§Ù„Ù…Ù†Ø²Ù„', 1, 'BOOLEAN'],
      ['Ø¯Ø®ÙˆÙ„/Ø®Ø±ÙˆØ¬ Ø§Ù„Ù…Ø³Ø¬Ø¯', 1, 'BOOLEAN'],
      ['Ø§Ù„Ù…Ø´ÙŠ Ù„Ù„Ù…Ø³Ø¬Ø¯', 1, 'BOOLEAN'],
      ['Ø§Ù„Ø£ÙƒÙ„ ÙˆØ§Ù„Ø´Ø±Ø¨', 1, 'BOOLEAN'],
      ['Ø§Ù„Ø±ÙƒÙˆØ¨', 1, 'BOOLEAN'],
      ['Ø§Ù„Ù†ÙˆÙ…', 1, 'BOOLEAN'],
      ['Ø§Ù„Ø§Ø³ØªØºÙØ§Ø±100', 2, 'COUNT', 100],
      ['Ø­Ø¶ÙˆØ± Ø¯Ø±ÙˆØ³ Ø§Ù„Ø¹Ù„Ù… -Ø§Ù„Ø³Ø¨Øª ÙˆØ§Ù„Ø®Ù…ÙŠØ³-', 5, 'BOOLEAN'],
      ['Ù…Ø°Ø§ÙƒØ±Ø© Ø¯Ø±ÙˆØ³ Ø§Ù„Ø¹Ù„Ù…', 5, 'BOOLEAN'],
      ['Ø¨Ø± Ø§Ù„ÙˆØ§Ù„Ø¯ÙŠÙ†', 5, 'BOOLEAN'],
      ['Ù…Ø°Ø§ÙƒØ±Ø© Ø§Ù„Ø¯Ø±Ø§Ø³Ø© Ø£Ùˆ Ø¥ØªÙ‚Ø§Ù† Ø§Ù„Ø¹Ù…Ù„ 5 Ø³Ø§Ø¹Ø§Øª', 5, 'BOOLEAN'],
      ['Ø¯Ø¹ÙˆØ©', 2, 'BOOLEAN'],
    ],
  },
  {
    name: 'Ø§Ù„Ø¸Ù‡Ø±',
    items: [
      ['ØµÙ„Ø§Ø© Ø§Ù„Ø¶Ø­Ù‰', 2, 'BOOLEAN'],
      ['Ø§Ù„Ø³Ù†Ø© Ø§Ù„Ù‚Ø¨Ù„ÙŠØ© 4 Ø±ÙƒØ¹Ø§Øª', 2, 'BOOLEAN'],
      ['الجماعة الأولى أو الجمعة (الظهر)', 5, 'BOOLEAN'],
      ['Ø£Ø°ÙƒØ§Ø± Ø¨Ø¹Ø¯ Ø§Ù„ØµÙ„Ø§Ø©', 2, 'BOOLEAN'],
      ['Ø§Ù„Ø³Ù†Ø© Ø§Ù„Ø¨Ø¹Ø¯ÙŠØ©', 2, 'BOOLEAN'],
      ['Ø±ÙƒØ¹ØªÙŠÙ† Ø­Ø±Ù…Ù‡Ø§ Ø§Ù„Ù„Ù‡ Ø¹Ù„Ù‰ Ø§Ù„Ù†Ø§Ø±', 2, 'BOOLEAN'],
    ],
  },
  {
    name: 'Ø§Ù„Ø¹ØµØ±',
    items: [
      ['4 Ø±ÙƒØ¹Ø§Øª Ù‚Ø¨Ù„', 2, 'BOOLEAN'],
      ['الجماعة الأولى (العصر)', 5, 'BOOLEAN'],
      ['Ø£Ø°ÙƒØ§Ø± Ø¨Ø¹Ø¯ Ø§Ù„ØµÙ„Ø§Ø©', 2, 'BOOLEAN'],
      ['Ø£Ø°ÙƒØ§Ø± Ø§Ù„Ù…Ø³Ø§Ø¡', 2, 'BOOLEAN'],
    ],
  },
  {
    name: 'Ø§Ù„Ù…ØºØ±Ø¨',
    items: [
      ['الجماعة الأولى (المغرب)', 5, 'BOOLEAN'],
      ['Ø£Ø°ÙƒØ§Ø± Ø¨Ø¹Ø¯ Ø§Ù„ØµÙ„Ø§Ø©', 2, 'BOOLEAN'],
      ['Ø§Ù„Ø³Ù†Ø© Ø§Ù„Ø¨Ø¹Ø¯ÙŠØ©', 2, 'BOOLEAN'],
    ],
  },
  {
    name: 'Ø§Ù„Ø¹Ø´Ø§Ø¡',
    items: [
      ['الجماعة الأولى (العشاء)', 5, 'BOOLEAN'],
      ['Ø£Ø°ÙƒØ§Ø± Ø¨Ø¹Ø¯ Ø§Ù„ØµÙ„Ø§Ø©', 2, 'BOOLEAN'],
      ['Ø§Ù„Ø³Ù†Ø© Ø§Ù„Ø¨Ø¹Ø¯ÙŠØ©', 2, 'BOOLEAN'],
    ],
  },
  {
    name: 'Ø§Ù„Ù„ÙŠÙ„',
    items: [
      ['Ø§Ù„Ù‚ÙŠØ§Ù… Ø±ÙƒØ¹ØªÙŠÙ†', 4, 'BOOLEAN'],
      ['Ø§Ù„ÙˆØªØ±', 1, 'BOOLEAN'],
      ['Ø¯Ø¹Ø§Ø¡ Ø§Ù„ÙˆØªØ±', 2, 'BOOLEAN'],
    ],
  },
  {
    name: 'Ø§Ù„Ù‚Ø±Ø¢Ù†',
    items: [
      ['Ù‚Ø±Ø§Ø¡Ø© Ø§Ù„ÙˆØ±Ø¯/Ø­Ø²Ø¨', 4, 'COUNT', 1],
      ['ØªØ³Ù…ÙŠØ¹ Ø§Ù„Ù‚Ø±Ø¢Ù†', 2, 'BOOLEAN'],
    ],
  },
  {
    name: 'Ø£Ø°ÙƒØ§Ø± ÙˆØ£Ø¹Ù…Ø§Ù„ ØµØ§Ù„Ø­Ø©',
    items: [
      ['Ø§Ù„ØªØ³Ø¨ÙŠØ­ ÙˆØ§Ù„ØªÙ‡Ù„ÙŠÙ„ 100', 2, 'COUNT', 100],
      ['Ø§Ù„ØµÙ„Ø§Ø© Ø¹Ù„Ù‰ Ø§Ù„Ù†Ø¨ÙŠ 100', 2, 'COUNT', 100],
      ['Ø­Ø¶ÙˆØ± Ø§Ù„Ù…Ù‚Ø±Ø£Ø©', 2, 'BOOLEAN'],
      ['Ø·Ù„Ø¨ Ø§Ù„Ø¹Ù„Ù…', 2, 'BOOLEAN'],
    ],
  },
  {
    name: 'Ø£Ø¹Ù…Ø§Ù„ Ø§Ù„Ø¬Ù…Ø¹Ø©',
    daysOfWeek: [FRIDAY],
    items: [
      ['Ø§Ù„ØªØ¨ÙƒÙŠØ±/15 Ø¯Ù‚ÙŠÙ‚Ø©', 1, 'BOOLEAN'],
      ['Ø³ÙˆØ±Ø© Ø§Ù„ÙƒÙ‡Ù', 1, 'BOOLEAN'],
      ['Ø§Ù„ØµÙ„Ø§Ø© Ø¹Ù„Ù‰ Ø§Ù„Ù†Ø¨ÙŠ', 1, 'BOOLEAN'],
      ['Ø§Ù„ØºØ³Ù„', 1, 'BOOLEAN'],
      ['Ø§Ù„ØªØ·ÙŠØ¨', 1, 'BOOLEAN'],
      ['Ù„Ø¨Ø³ Ø£ÙØ¶Ù„ Ø§Ù„Ø«ÙŠØ§Ø¨', 1, 'BOOLEAN'],
      ['Ø³Ù†Ù† Ø§Ù„ÙØ·Ø±Ø©', 1, 'BOOLEAN'],
      ['Ø§Ù„Ø¯Ø¹Ø§Ø¡ Ù‚Ø¨Ù„ Ø§Ù„Ù…ØºØ±Ø¨', 1, 'BOOLEAN'],
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
  if (process.env.NODE_ENV === 'production') {
    console.log('Skipping development admin seed in production.');
    return;
  }

  const [superAdminRole, developmentRegion] = await Promise.all([
    ensureRbacRegistry(),
    ensureDevelopmentRegion(),
  ]);

  const passwordHash = await hashPassword(ADMIN_PASSWORD);

  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      roleId: superAdminRole.id,
      regionId: developmentRegion.id,
      onboardingStatus: ONBOARDING_STATUS.ACTIVE,
    },
    create: {
      fullName: 'Development Admin',
      email: ADMIN_EMAIL,
      passwordHash,
      roleId: superAdminRole.id,
      regionId: developmentRegion.id,
      onboardingStatus: ONBOARDING_STATUS.ACTIVE,
      isActive: true,
      timezone: 'Africa/Cairo',
    },
  });

  console.log(`Development admin ensured: ${ADMIN_EMAIL} (${ROLES.SUPER_ADMIN})`);
}

async function seedWorshipLevels() {
  const firstLevel = await prisma.worshipLevel.upsert({
    where: { order: FIRST_WORSHIP_LEVEL.order },
    update: {
      name: FIRST_WORSHIP_LEVEL.name,
      description: FIRST_WORSHIP_LEVEL.description,
      isActive: true,
      deletedAt: null,
    },
    create: {
      ...FIRST_WORSHIP_LEVEL,
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
  const [title, points, inputType, targetValue = null] = item;

  return {
    title,
    inputType,
    targetValue,
    categoryName: category.name,
    daysOfWeek: category.daysOfWeek ?? [],
    order: (category.order * 100) + itemIndex,
    score: points,
    xp: points,
  };
}

async function assertWorshipReplacementIsSafe(sheetCategoryNames, sheetItemTitles) {
  const trackedLegacyItems = await prisma.trackingEntry.findMany({
    where: {
      worshipItem: {
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
    throw new Error(
      `Cannot replace worship seed data because existing tracking references legacy items. Examples: ${examples}`,
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

async function seedFirstLevelRequirements(firstLevel) {
  const activeItems = await prisma.worshipItem.findMany({
    where: {
      isActive: true,
      deletedAt: null,
    },
    select: { id: true },
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

async function assignUsersWithoutActiveLevel(firstLevel) {
  const usersWithoutActiveLevel = await prisma.user.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      userLevels: { none: { isActive: true } },
    },
    select: { id: true },
  });

  if (usersWithoutActiveLevel.length === 0) {
    console.log('No users needed retroactive worship level assignment.');
    return;
  }

  await prisma.userLevel.createMany({
    data: usersWithoutActiveLevel.map((user) => ({
      userId: user.id,
      levelId: firstLevel.id,
      isActive: true,
    })),
    skipDuplicates: true,
  });

  console.log(`Retroactive worship level assignments ensured: ${usersWithoutActiveLevel.length} users`);
}

async function main() {
  const firstLevel = await seedWorshipLevels();
  await seedMentorWorshipSheet();
  await seedFirstLevelRequirements(firstLevel);
  await assignUsersWithoutActiveLevel(firstLevel);
  await seedDevelopmentAdmin();
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
