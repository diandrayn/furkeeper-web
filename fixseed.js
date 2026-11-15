const fs=require('fs');
let s=fs.readFileSync('prisma/seed.mjs','utf8');
s=s.split('operating_hours: []').join('operating_hours: JSON.stringify([])');
fs.writeFileSync('prisma/seed.mjs',s);
console.log('done');
