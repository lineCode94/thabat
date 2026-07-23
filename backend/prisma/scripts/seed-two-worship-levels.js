import { prisma } from '../../src/lib/prisma.js';

const BEGINNER_LEVEL = {
  order: 1,
  name: 'المستوى المبتدئ',
  description: 'جدول البداية الأساسي للمدعو، مناسب لبناء عادة المتابعة اليومية.',
};

const ADVANCED_LEVEL = {
  order: 2,
  name: 'المستوى المتقدم',
  description: 'الجدول الأصعب للمدعو المتقدم، مبني على جدول المستوى المبتدئ مع زيادات في السنن والمتابعة.',
};

const FRIDAY = 5;

const ADVANCED_EXTRAS = [
  {
    category: 'Fajr',
    items: [
      ['التبكير للفجر', 3, 'BOOLEAN'],
      ['أذكار الأذان للفجر', 1, 'BOOLEAN'],
      ['السواك للفجر', 1, 'BOOLEAN'],
      ['الصف الأول في الفجر', 1, 'BOOLEAN'],
      ['قضاء الفوائت بعد الفجر', 2, 'BOOLEAN'],
      ['الجلوس إلى الشروق', 1, 'BOOLEAN'],
    ],
  },
  {
    category: 'الظهر',
    items: [
      ['التبكير للظهر', 3, 'BOOLEAN'],
      ['أذكار الأذان للظهر', 1, 'BOOLEAN'],
      ['السواك للظهر', 1, 'BOOLEAN'],
      ['الصف الأول في الظهر', 1, 'BOOLEAN'],
      ['قضاء الفوائت بعد الظهر', 2, 'BOOLEAN'],
    ],
  },
  {
    category: 'العصر',
    items: [
      ['التبكير للعصر', 3, 'BOOLEAN'],
      ['أذكار الأذان للعصر', 1, 'BOOLEAN'],
      ['الدعاء بين الأذانين للعصر', 1, 'BOOLEAN'],
      ['السواك للعصر', 1, 'BOOLEAN'],
      ['الصف الأول في العصر', 1, 'BOOLEAN'],
      ['قضاء الفوائت بعد العصر', 2, 'BOOLEAN'],
    ],
  },
  {
    category: 'المغرب',
    items: [
      ['التبكير للمغرب', 3, 'BOOLEAN'],
      ['أذكار الأذان للمغرب', 1, 'BOOLEAN'],
      ['الدعاء بين الأذانين للمغرب', 1, 'BOOLEAN'],
      ['السواك للمغرب', 1, 'BOOLEAN'],
      ['الصف الأول في المغرب', 1, 'BOOLEAN'],
      ['قضاء الفوائت بعد المغرب', 2, 'BOOLEAN'],
    ],
  },
  {
    category: 'العشاء',
    items: [
      ['التبكير للعشاء', 3, 'BOOLEAN'],
      ['أذكار الأذان للعشاء', 1, 'BOOLEAN'],
      ['الدعاء بين الأذانين للعشاء', 1, 'BOOLEAN'],
      ['السواك للعشاء', 1, 'BOOLEAN'],
      ['الصف الأول في العشاء', 1, 'BOOLEAN'],
      ['قضاء الفوائت بعد العشاء', 2, 'BOOLEAN'],
    ],
  },
  {
    category: 'الليل',
    items: [
      ['عدد ركعات قيام الليل', 2, 'COUNT', 2],
      ['الاستغفار آخر الليل', 1, 'BOOLEAN'],
      ['دعاء للنفس', 1, 'BOOLEAN'],
      ['دعاء للمشايخ', 1, 'BOOLEAN'],
      ['دعاء للإخوة', 1, 'BOOLEAN'],
      ['دعاء للمسلمين', 1, 'BOOLEAN'],
    ],
  },
  {
    category: 'القرآن',
    items: [
      ['تلاوة/تدبر', 2, 'BOOLEAN'],
      ['مراجعة/حفظ متقدم', 2, 'BOOLEAN'],
    ],
  },
  {
    category: 'أذكار وأعمال يومية',
    items: [
      ['استغفار في المجالس', 1, 'BOOLEAN'],
      ['كفارة المجالس', 1, 'BOOLEAN'],
      ['الاستغفار المطلق', 1, 'COUNT', 100],
      ['بر الوالدين المتقدم', 1, 'BOOLEAN'],
      ['صلة الرحم', 1, 'BOOLEAN'],
      ['أداء الحقوق', 1, 'BOOLEAN'],
      ['ترك آفات اللسان', 1, 'BOOLEAN'],
      ['ترك فضول النظر', 1, 'BOOLEAN'],
      ['معالجة القلب', 1, 'BOOLEAN'],
      ['الصيام', 2, 'BOOLEAN'],
      ['الصدقة', 1, 'BOOLEAN'],
      ['صلاة الاستخارة', 1, 'BOOLEAN'],
      ['المحافظة على الوضوء', 1, 'BOOLEAN'],
      ['الوضوء للنوم', 1, 'BOOLEAN'],
      ['الدعوة المتقدمة', 1, 'BOOLEAN'],
      ['العلم الدنيوي', 1, 'BOOLEAN'],
      ['حضور العلم المتقدم', 5, 'BOOLEAN'],
      ['مذاكرة العلم الشرعي', 5, 'BOOLEAN'],
      ['المحاسبة', 1, 'BOOLEAN'],
      ['التوبة', 1, 'BOOLEAN'],
    ],
  },
  {
    category: 'أعمال الجمعة',
    daysOfWeek: [FRIDAY],
    items: [
      ['زيارة القبور', 5, 'BOOLEAN'],
      ['الغسل للجمعة', 1, 'BOOLEAN'],
      ['لبس أفضل الثياب للجمعة', 1, 'BOOLEAN'],
      ['الطيب للجمعة', 1, 'BOOLEAN'],
      ['السواك للجمعة', 1, 'BOOLEAN'],
      ['اختيار المسجد الأفضل', 1, 'BOOLEAN'],
      ['التبكير للجمعة', 1, 'BOOLEAN'],
      ['إدراك صعود الإمام', 1, 'BOOLEAN'],
      ['الدعاء بعد العصر يوم الجمعة', 1, 'BOOLEAN'],
      ['سورة الكهف يوم الجمعة', 1, 'BOOLEAN'],
      ['الصلاة على النبي يوم الجمعة', 1, 'BOOLEAN'],
    ],
  },
];

async function upsertLevel(level) {
  return prisma.worshipLevel.upsert({
    where: { order: level.order },
    update: {
      name: level.name,
      description: level.description,
      isActive: true,
      deletedAt: null,
    },
    create: {
      ...level,
      isActive: true,
    },
  });
}

async function upsertAdvancedItem(categoryData, itemData, categoryIndex, itemIndex) {
  const category = await prisma.worshipCategory.upsert({
    where: { name: categoryData.category },
    update: { isActive: true, deletedAt: null },
    create: {
      name: categoryData.category,
      order: categoryIndex + 1,
      isActive: true,
    },
  });

  const [title, score, inputType, targetValue = null] = itemData;
  const existing = await prisma.worshipItem.findFirst({
    where: {
      categoryId: category.id,
      title,
    },
  });
  const data = {
    title,
    inputType,
    targetType: inputType.toLowerCase(),
    targetValue,
    daysOfWeek: categoryData.daysOfWeek ?? [],
    order: 10000 + ((categoryIndex + 1) * 100) + itemIndex,
    score,
    xp: score,
    isActive: true,
    deletedAt: null,
  };

  if (existing) {
    return prisma.worshipItem.update({
      where: { id: existing.id },
      data,
      select: { id: true },
    });
  }

  return prisma.worshipItem.create({
    data: {
      categoryId: category.id,
      ...data,
    },
    select: { id: true },
  });
}

async function main() {
  const beginnerLevel = await upsertLevel(BEGINNER_LEVEL);
  const advancedLevel = await upsertLevel(ADVANCED_LEVEL);

  await prisma.worshipLevel.updateMany({
    where: { order: { notIn: [BEGINNER_LEVEL.order, ADVANCED_LEVEL.order] } },
    data: { isActive: false, deletedAt: new Date() },
  });

  const beginnerRequirements = await prisma.levelRequirement.findMany({
    where: { levelId: beginnerLevel.id },
    select: { worshipItemId: true },
  });

  const advancedExtraItems = [];
  for (const [categoryIndex, category] of ADVANCED_EXTRAS.entries()) {
    for (const [itemIndex, item] of category.items.entries()) {
      advancedExtraItems.push(await upsertAdvancedItem(category, item, categoryIndex, itemIndex + 1));
    }
  }

  const advancedRequirementIds = [
    ...new Set([
      ...beginnerRequirements.map((requirement) => requirement.worshipItemId),
      ...advancedExtraItems.map((item) => item.id),
    ]),
  ];

  await prisma.levelRequirement.deleteMany({
    where: { levelId: advancedLevel.id },
  });
  await prisma.levelRequirement.createMany({
    data: advancedRequirementIds.map((worshipItemId) => ({
      levelId: advancedLevel.id,
      worshipItemId,
    })),
    skipDuplicates: true,
  });

  console.log(`Worship levels ensured: ${BEGINNER_LEVEL.name}, ${ADVANCED_LEVEL.name}`);
  console.log(`Advanced extras ensured: ${advancedExtraItems.length}`);
  console.log(`Advanced requirements ensured: ${advancedRequirementIds.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
