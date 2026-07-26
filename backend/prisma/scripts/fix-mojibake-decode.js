import { PrismaClient } from '@prisma/client';
import iconv from 'iconv-lite';

const prisma = new PrismaClient();

function fixString(str) {
  if (!str) return str;
  if (str.includes('Ø') || str.includes('Ù')) {
    try {
      const buf = iconv.encode(str, 'win1252');
      return iconv.decode(buf, 'utf8');
    } catch(e) {
      console.error(`Failed to decode string: ${str}`, e);
      return str;
    }
  }
  return str;
}

async function main() {
  console.log('--- FIXING MOJIBAKE ---');

  // 1. Fix WorshipLevels
  const levels = await prisma.worshipLevel.findMany();
  for (const l of levels) {
    const fixedName = fixString(l.name);
    const fixedDesc = fixString(l.description);
    
    if (fixedName !== l.name || fixedDesc !== l.description) {
      await prisma.worshipLevel.update({
        where: { id: l.id },
        data: { name: fixedName, description: fixedDesc }
      });
      console.log(`Fixed Level [${l.order}]: ${l.name} -> ${fixedName}`);
    }
  }

  // 2. Fix WorshipCategories
  const categories = await prisma.worshipCategory.findMany();
  for (const c of categories) {
    const fixedName = fixString(c.name);
    if (fixedName !== c.name) {
      const existing = await prisma.worshipCategory.findFirst({ where: { name: fixedName, id: { not: c.id } } });
      if (existing) {
        console.log(`Warning: Category ${fixedName} already exists! Merging category ${c.id} into ${existing.id}`);
        await prisma.worshipItem.updateMany({
          where: { categoryId: c.id },
          data: { categoryId: existing.id }
        });
        await prisma.worshipCategory.delete({ where: { id: c.id } });
        console.log(`Merged category ${c.name} into ${existing.name}`);
      } else {
        await prisma.worshipCategory.update({
          where: { id: c.id },
          data: { name: fixedName }
        });
        console.log(`Fixed Category: ${c.name} -> ${fixedName}`);
      }
    }
  }

  // 3. Fix WorshipItems
  const items = await prisma.worshipItem.findMany();
  for (const i of items) {
    const fixedTitle = fixString(i.title);
    if (fixedTitle !== i.title) {
      const existing = await prisma.worshipItem.findFirst({ 
        where: { title: fixedTitle, categoryId: i.categoryId, id: { not: i.id } } 
      });
      if (existing) {
        console.log(`Warning: Item ${fixedTitle} already exists in category ${i.categoryId}! Merging ${i.id} into ${existing.id}`);
        await prisma.levelRequirement.updateMany({
          where: { worshipItemId: i.id },
          data: { worshipItemId: existing.id }
        });
        await prisma.trackingEntry.updateMany({
          where: { worshipItemId: i.id },
          data: { worshipItemId: existing.id }
        });
        await prisma.userCustomRequirement.updateMany({
          where: { worshipItemId: i.id },
          data: { worshipItemId: existing.id }
        });
        await prisma.userExcludedRequirement.updateMany({
          where: { worshipItemId: i.id },
          data: { worshipItemId: existing.id }
        });
        await prisma.worshipItem.delete({ where: { id: i.id } });
        console.log(`Merged item ${i.title} into ${existing.title}`);
      } else {
        await prisma.worshipItem.update({
          where: { id: i.id },
          data: { title: fixedTitle }
        });
        console.log(`Fixed Item: ${i.title} -> ${fixedTitle}`);
      }
    }
  }

  console.log('--- DONE ---');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
