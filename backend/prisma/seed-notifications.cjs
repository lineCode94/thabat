const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log('No user found');
    await prisma.$disconnect();
    return;
  }

  const existing = await prisma.notification.count({ where: { userId: user.id } });
  if (existing > 0) {
    console.log('Notifications already exist for', user.email, '- skipping seed');
    await prisma.$disconnect();
    return;
  }

  await prisma.notification.createMany({
    data: [
      {
        userId: user.id,
        title: 'Welcome to THABAT!',
        message: 'Start your worship journey by completing your first tracking entry.',
        type: 'ADMINISTRATIVE',
        priority: 'HIGH',
      },
      {
        userId: user.id,
        title: 'Daily Reminder',
        message: "Don't forget to complete today's worship tracking.",
        type: 'REMINDER',
        priority: 'MEDIUM',
      },
      {
        userId: user.id,
        title: 'Badge Unlocked: Early Bird',
        message: 'You earned the Early Bird badge for completing your first Fajr prayer!',
        type: 'ACHIEVEMENT',
        priority: 'HIGH',
      },
    ],
  });

  console.log('Seeded 3 test notifications for', user.email);
  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
