import { prisma } from '../../src/lib/prisma.js';

const RENAMES = [
  {
    categoryName: 'Fajr',
    from: 'الجماعة الأولى',
    to: 'الجماعة الأولى (الفجر)',
  },
  {
    categoryName: 'الظهر',
    from: 'الجماعة الأولى أو الجمعة',
    to: 'الجماعة الأولى أو الجمعة (الظهر)',
  },
  {
    categoryName: 'العصر',
    from: 'الجماعة الأولى',
    to: 'الجماعة الأولى (العصر)',
  },
  {
    categoryName: 'المغرب',
    from: 'الجماعة الأولى',
    to: 'الجماعة الأولى (المغرب)',
  },
  {
    categoryName: 'العشاء',
    from: 'الجماعة الأولى',
    to: 'الجماعة الأولى (العشاء)',
  },
];

async function renameCongregationItems() {
  let updated = 0;

  for (const item of RENAMES) {
    const result = await prisma.worshipItem.updateMany({
      where: {
        title: item.from,
        deletedAt: null,
        category: {
          name: item.categoryName,
        },
      },
      data: {
        title: item.to,
      },
    });

    updated += result.count;
    console.log(`${item.categoryName}: ${result.count} item(s) renamed to "${item.to}"`);
  }

  console.log(`Done. Total renamed: ${updated}`);
}

renameCongregationItems()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
