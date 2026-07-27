/**
 * fix-fa-letter.js
 *
 * Directly updates worship items that have the Arabic letter "ف"
 * corrupted to "?" or a replacement character.
 *
 * Rows are identified by their stable `order` field.
 * This script is SAFE: only does targeted UPDATE calls, never deletes.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Ground-truth: order → correct Arabic title (from seed.js)
const FIXES = {
  107:  'مراجعة/حفظ قرآن جديد',
  211:  'الاستغفار100',
  1002: 'سورة الكهف',
  1006: 'لبس أفضل الثياب',
  1007: 'سنن الفطرة',
};

async function main() {
  console.log('=== Fix Arabic letter "ف" in production DB ===\n');

  const items = await prisma.worshipItem.findMany({
    where: { order: { in: Object.keys(FIXES).map(Number) } },
    select: { id: true, order: true, title: true },
  });

  for (const item of items) {
    const correctTitle = FIXES[item.order];
    if (item.title === correctTitle) {
      console.log(`[OK]    Order ${item.order}: already correct → "${item.title}"`);
      continue;
    }

    await prisma.worshipItem.update({
      where: { id: item.id },
      data: { title: correctTitle },
    });

    console.log(`[FIXED] Order ${item.order}: "${item.title}" → "${correctTitle}"`);
  }

  // Verify no "?" remain
  const allItems = await prisma.worshipItem.findMany({ select: { order: true, title: true } });
  const stillBad = allItems.filter(i => i.title.includes('?') || i.title.includes('\uFFFD'));
  if (stillBad.length === 0) {
    console.log('\n✓ No remaining "?" characters in any worship item title.');
  } else {
    console.log(`\n⚠ Still corrupted:`);
    stillBad.forEach(i => console.log(`  Order ${i.order}: ${i.title}`));
  }

  console.log('\n=== Done ===');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
