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
        select: { trackingEntries: true }
      }
    }
  });

  console.log(`Found ${corruptedItems.length} corrupted items.`);
  
  let itemsWithData = 0;
  for (const item of corruptedItems) {
    if (item._count.trackingEntries > 0) {
      console.log(`Corrupted item "${item.title}" (ID: ${item.id}) has ${item._count.trackingEntries} tracking entries!`);
      itemsWithData++;
    }
  }

  console.log(`\nTotal corrupted items with tracking data: ${itemsWithData}`);

  const okItems = await prisma.worshipItem.findMany({
    where: {
      AND: [
        { title: { not: { contains: 'Ø' } } },
        { title: { not: { contains: 'Ù' } } }
      ]
    },
    include: {
      _count: {
        select: { trackingEntries: true }
      }
    }
  });

  let okItemsWithData = 0;
  for (const item of okItems) {
    if (item._count.trackingEntries > 0) {
      console.log(`OK item "${item.title}" (ID: ${item.id}) has ${item._count.trackingEntries} tracking entries.`);
      okItemsWithData++;
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
