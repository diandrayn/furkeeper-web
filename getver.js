const {PrismaClient} = require('@prisma/client');
const p = new PrismaClient();
p.$queryRaw`SELECT VERSION() as v`.then(r=>{
  console.log(r[0].v);
  p.$disconnect();
}).catch(e=>{
  console.error(e.message);
  process.exit(1);
});
