import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const corruptedItems = await prisma.worshipItem.findMany({
    where: {
      OR: [
        { title: { contains: 'Ø' } },
        { title: { contains: 'Ù' } }
      ]
    },
    include: {
      _count: {
        select: { 
          trackingEntries: true,
          levelRequirements: true,
          userCustomRequirements: true,
          userExcludedRequirements: true
        }
      }
    }
  });

  let hasRefs = false;
  for (const item of corruptedItems) {
    if (item._count.trackingEntries > 0 || item._count.levelRequirements > 0 || item._count.userCustomRequirements > 0 || item._count.userExcludedRequirements > 0) {
      console.log(`Corrupted item ${item.title} has refs! (Tracking: ${item._count.trackingEntries}, LevelReq: ${item._count.levelRequirements}, CustomReq: ${item._count.userCustomRequirements}, ExcludedReq: ${item._count.userExcludedRequirements})`);
      hasRefs = true;
    }
  }

  if (!hasRefs) {
    console.log(`All ${corruptedItems.length} corrupted items have NO references. They can be safely deleted.`);
  }

  const corruptedCategories = await prisma.worshipCategory.findMany({
    where: {
      OR: [
        { name: { contains: 'Ø' } },
        { name: { contains: 'Ù' } }
      ]
    },
    include: {
      _count: {
        select: { worshipItems: true }
      }
    }
  });

  let hasItems = false;
  for (const cat of corruptedCategories) {
    // Check if it has any NON-corrupted items attached
    const items = await prisma.worshipItem.findMany({ where: { categoryId: cat.id } });
    const okItems = items.filter(i => !i.title.includes('Ø') && !i.title.includes('Ù'));
    if (okItems.length > 0) {
      console.log(`Corrupted category ${cat.name} has ${okItems.length} OK items attached!`);
      hasItems = true;
    }
  }

  if (!hasItems) {
    console.log(`All ${corruptedCategories.length} corrupted categories have NO valid items attached. They can be safely deleted.`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
