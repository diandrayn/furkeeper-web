const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const r = await p.$queryRawUnsafe('SELECT VERSION() as v');
  console.log(r[0].v);
  const pc = await p.profiles.count();
  const sc = await p.stores.count();
  const prc = await p.products.count();
  const svc = await p.services.count();
  console.log(JSON.stringify({pc,sc,prc,svc}));
  await p.$disconnect();
})();
