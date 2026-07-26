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
        select: { levelRequirements: true }
      }
    }
  });
  
  let corReqs = 0;
  for (const item of corruptedItems) {
    corReqs += item._count.levelRequirements;
  }
  console.log(`Corrupted items have ${corReqs} level requirements.`);

  const okItems = await prisma.worshipItem.findMany({
    where: {
      AND: [
        { title: { not: { contains: 'Ø' } } },
        { title: { not: { contains: 'Ù' } } }
      ]
    },
    include: {
      _count: {
        select: { levelRequirements: true }
      }
    }
  });

  let okReqs = 0;
  for (const item of okItems) {
    okReqs += item._count.levelRequirements;
  }
  console.log(`OK items have ${okReqs} level requirements.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
