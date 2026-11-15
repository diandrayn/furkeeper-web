import {PrismaClient} from '@prisma/client';
const p = new PrismaClient();
const r = await p.$queryRaw`SELECT VERSION() as v`;
console.log(r[0].v);
await p.$disconnect();
