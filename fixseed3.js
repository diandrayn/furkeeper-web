const fs=require('fs');
let s=fs.readFileSync('prisma/seed.mjs','utf8');
s=s.replace(/variants: p\.variants \|\| \[\]/g, 'variants: JSON.stringify(p.variants || [])');
fs.writeFileSync('prisma/seed.mjs',s);
console.log('ok');
