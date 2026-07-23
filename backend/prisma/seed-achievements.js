import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const achievements = [
  { name: 'First Tracking', description: 'Record your very first day of worship tracking.' },
  { name: '7 Day Streak', description: 'Complete 7 consecutive days of worship tracking.' },
  { name: '30 Day Streak', description: 'Complete 30 consecutive days of worship tracking.' },
  { name: '1000 XP', description: 'Earn a total of 1,000 XP through worship activities.' },
  { name: '100 Prayers Logged', description: 'Complete prayer worship items 100 times.' },
  { name: '500 Quran Pages', description: 'Log a total of 500 Quran pages across all tracking sessions.' },
  { name: 'First Weekly Mission', description: 'Complete your first weekly mission.' }
];

async function main() {
  console.log('Seeding achievements...');
  for (const a of achievements) {
    await prisma.achievement.upsert({
      where: { name: a.name },
      update: { description: a.description },
      create: { name: a.name, description: a.description }
    });
  }
  console.log('Seeding complete.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
