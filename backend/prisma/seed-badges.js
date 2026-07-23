import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const activeBadges = [
  {
    key: 'takbiratul_ihram_daily',
    name: 'محافظ تكبيرة الإحرام',
    description: 'أكمل تكبيرة الإحرام مرة واحدة على الأقل.',
    iconUrl: null,
    category: 'Prayer',
    rarity: 'Common',
    isVisible: true,
    condition: { type: 'tracking', metric: 'completed_item', title: 'تكبيرة الإحرام', threshold: 1 },
    sortOrder: 10,
  },
  {
    key: 'rawatib_sunan_daily',
    name: 'محافظ السنن الرواتب',
    description: 'أكمل سنة قبلية أو بعدية مرة واحدة على الأقل.',
    iconUrl: null,
    category: 'Prayer',
    rarity: 'Common',
    isVisible: true,
    condition: { type: 'tracking', metric: 'completed_rawatib', threshold: 1 },
    sortOrder: 20,
  },
  {
    key: 'mosque_entry_daily',
    name: 'ذاكر المسجد',
    description: 'أكمل ذكر دخول أو خروج المسجد مرة واحدة على الأقل.',
    iconUrl: null,
    category: 'Prayer',
    rarity: 'Common',
    isVisible: true,
    condition: { type: 'tracking', metric: 'completed_item', title: 'دخول/خروج المسجد', threshold: 1 },
    sortOrder: 30,
  },
  {
    key: 'mosque_prayer_week',
    name: 'رفيق المسجد',
    description: 'حافظ على ذكر دخول أو خروج المسجد 7 أيام متتالية.',
    iconUrl: null,
    category: 'Prayer',
    rarity: 'Rare',
    isVisible: true,
    condition: { type: 'tracking', metric: 'consecutive_item_days', title: 'دخول/خروج المسجد', threshold: 7 },
    sortOrder: 40,
  },
  {
    key: 'rawatib_sunan_week',
    name: 'ثبات السنن',
    description: 'حافظ على سنة قبلية أو بعدية 7 أيام متتالية.',
    iconUrl: null,
    category: 'Prayer',
    rarity: 'Rare',
    isVisible: true,
    condition: { type: 'tracking', metric: 'consecutive_rawatib_days', threshold: 7 },
    sortOrder: 50,
  },
  {
    key: 'night_prayer_two_rakah_week',
    name: 'قيام الركعتين',
    description: 'حافظ على القيام ركعتين 7 أيام متتالية.',
    iconUrl: null,
    category: 'Prayer',
    rarity: 'Rare',
    isVisible: true,
    condition: { type: 'tracking', metric: 'consecutive_item_days', title: 'القيام ركعتين', threshold: 7 },
    sortOrder: 60,
  },
  {
    key: 'takbiratul_ihram_mosque_40_days',
    name: 'أربعون يومًا على العهد',
    description: 'حافظ على تكبيرة الإحرام وذكر دخول أو خروج المسجد 40 يومًا متتالية.',
    iconUrl: null,
    category: 'Prayer',
    rarity: 'Legendary',
    isVisible: true,
    condition: {
      type: 'tracking',
      metric: 'consecutive_all_items_days',
      titles: ['تكبيرة الإحرام', 'دخول/خروج المسجد'],
      threshold: 40,
    },
    sortOrder: 70,
  },
  {
    key: 'daily_wird_recitation',
    name: 'صاحب الورد',
    description: 'سجل ورد القرآن مرة واحدة على الأقل.',
    iconUrl: null,
    category: 'Quran',
    rarity: 'Common',
    isVisible: true,
    condition: { type: 'tracking', metric: 'completed_item', title: 'قراءة الورد/حزب', threshold: 1 },
    sortOrder: 80,
  },
  {
    key: 'daily_quran_memorization',
    name: 'بداية الحفظ',
    description: 'أكمل مراجعة أو حفظ قرآن جديد مرة واحدة على الأقل.',
    iconUrl: null,
    category: 'Quran',
    rarity: 'Common',
    isVisible: true,
    condition: { type: 'tracking', metric: 'completed_item', title: 'مراجعة/حفظ قرآن جديد', threshold: 1 },
    sortOrder: 90,
  },
  {
    key: 'weekly_wird_consistency',
    name: 'ورد أسبوع كامل',
    description: 'حافظ على ورد القرآن 7 أيام متتالية.',
    iconUrl: null,
    category: 'Quran',
    rarity: 'Rare',
    isVisible: true,
    condition: { type: 'tracking', metric: 'consecutive_item_days', title: 'قراءة الورد/حزب', threshold: 7 },
    sortOrder: 100,
  },
  {
    key: 'quran_recitation_review',
    name: 'مراجع القرآن',
    description: 'أكمل تسميع القرآن مرة واحدة على الأقل.',
    iconUrl: null,
    category: 'Quran',
    rarity: 'Common',
    isVisible: true,
    condition: { type: 'tracking', metric: 'completed_item', title: 'تسميع القرآن', threshold: 1 },
    sortOrder: 110,
  },
  {
    key: 'monthly_wird_consistency',
    name: 'ورد شهر كامل',
    description: 'حافظ على ورد القرآن 30 يومًا متتالية.',
    iconUrl: null,
    category: 'Quran',
    rarity: 'Epic',
    isVisible: true,
    condition: { type: 'tracking', metric: 'consecutive_item_days', title: 'قراءة الورد/حزب', threshold: 30 },
    sortOrder: 120,
  },
  {
    key: 'monthly_quran_recitation_review',
    name: 'تسميع شهر كامل',
    description: 'حافظ على تسميع القرآن 30 يومًا متتالية.',
    iconUrl: null,
    category: 'Quran',
    rarity: 'Epic',
    isVisible: true,
    condition: { type: 'tracking', metric: 'consecutive_item_days', title: 'تسميع القرآن', threshold: 30 },
    sortOrder: 130,
  },
  {
    key: 'quran_khatm_604_pages',
    name: 'ختمة القرآن',
    description: 'أكمل 604 عدادات في ورد القرآن.',
    iconUrl: null,
    category: 'Quran',
    rarity: 'Legendary',
    isVisible: true,
    condition: { type: 'tracking', metric: 'item_count_sum', title: 'قراءة الورد/حزب', threshold: 604 },
    sortOrder: 140,
  },
  {
    key: 'lesson_attendance_daily',
    name: 'جليس القرآن',
    description: 'حضر المقرأة مرة واحدة على الأقل.',
    iconUrl: null,
    category: 'Knowledge',
    rarity: 'Common',
    isVisible: true,
    condition: { type: 'tracking', metric: 'completed_item', title: 'حضور المقرأة', threshold: 1 },
    sortOrder: 150,
  },
  {
    key: 'dawah_invitation_daily',
    name: 'صاحب الدعوة',
    description: 'أكمل عبادة الدعوة مرة واحدة على الأقل.',
    iconUrl: null,
    category: 'Dawah',
    rarity: 'Common',
    isVisible: true,
    condition: { type: 'tracking', metric: 'completed_item', title: 'دعوة', threshold: 1 },
    sortOrder: 160,
  },
  {
    key: 'daily_score_good',
    name: 'يوم ثابت',
    description: 'أنهيت يومك بدرجة 50% أو أكثر.',
    iconUrl: null,
    category: 'XP',
    rarity: 'Common',
    isVisible: true,
    condition: { type: 'tracking', metric: 'daily_score_percentage', threshold: 50 },
    sortOrder: 170,
  },
  {
    key: 'daily_score_excellent',
    name: 'إنجاز اليوم',
    description: 'أنهيت يومك بدرجة 90% أو أكثر.',
    iconUrl: null,
    category: 'XP',
    rarity: 'Rare',
    isVisible: true,
    condition: { type: 'tracking', metric: 'daily_score_percentage', threshold: 90 },
    sortOrder: 180,
  },
];

const activeKeys = activeBadges.map((badge) => badge.key);

async function main() {
  console.log('Seeding active badges...');

  const archived = await prisma.badge.updateMany({
    where: {
      key: { notIn: activeKeys },
      deletedAt: null,
    },
    data: {
      isVisible: false,
      deletedAt: new Date(),
    },
  });

  for (const badge of activeBadges) {
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
    console.log(`  ✓ ${badge.name} (${badge.rarity})`);
  }

  console.log(`Archived ${archived.count} legacy badges.`);
  console.log(`Seeding complete. ${activeBadges.length} active badges upserted.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
