import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const email = 'm.zakariaa06@gmail.com';

const user = await prisma.user.findUnique({ where: { email } });
if (!user) {
  console.log('User not found');
} else {
  await prisma.user.delete({ where: { email } });
  console.log('Deleted:', email);
}

await prisma.$disconnect();