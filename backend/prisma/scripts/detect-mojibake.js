import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- MOJIBAKE DETECTION SCRIPT ---');
  console.log(`DATABASE_URL: ${process.env.DATABASE_URL?.split('@')[1]}`); // show host to confirm it's production

  // 1. Check WorshipLevels
  const levels = await prisma.worshipLevel.findMany({
    orderBy: { order: 'asc' }
  });
  console.log('\n--- Worship Levels ---');
  levels.forEach(l => {
    const isCorrupted = l.name.includes('Ø') || l.name.includes('Ù');
    console.log(`[${isCorrupted ? 'CORRUPTED' : 'OK'}] ID: ${l.id} | Order: ${l.order} | Name: ${l.name}`);
  });

  // 2. Check WorshipCategories
  const categories = await prisma.worshipCategory.findMany({
    orderBy: { order: 'asc' }
  });
  console.log('\n--- Worship Categories ---');
  let dupCount = 0;
  categories.forEach(c => {
    const isCorrupted = c.name.includes('Ø') || c.name.includes('Ù');
    console.log(`[${isCorrupted ? 'CORRUPTED' : 'OK'}] ID: ${c.id} | Order: ${c.order} | Name: ${c.name}`);
  });

  // 3. Check WorshipItems
  const items = await prisma.worshipItem.findMany({
    orderBy: { order: 'asc' },
    include: { category: true }
  });
  console.log('\n--- Worship Items ---');
  items.forEach(i => {
    const isCorrupted = i.title.includes('Ø') || i.title.includes('Ù');
    console.log(`[${isCorrupted ? 'CORRUPTED' : 'OK'}] ID: ${i.id} | Order: ${i.order} | Title: ${i.title} | Category: ${i.category?.name}`);
  });
}

main()
  .catch((e) => {
    console.error('Error during detection:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
