import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const items = await p.worshipItem.findMany({ orderBy: {order: 'asc'}, select: {id: true, order: true, title: true} });
const bad = items.filter(i => i.title.includes('?') || i.title.includes('\uFFFD') || i.title.includes('\u061F'));
console.log(JSON.stringify(bad, null, 2));
await p.$disconnect();
