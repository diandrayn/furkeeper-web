const fs=require('fs');
let s=fs.readFileSync('prisma/seed.mjs','utf8');
s=s.replace(/operating_hours: \[\]/g, "operating_hours: '[]'");
s=s.replace(/variants: Array\.isArray\(p\.variants\) \? p\.variants : \[\]/g, "variants: JSON.stringify(p.variants || [])");
fs.writeFileSync('prisma/seed.mjs',s);
console.log('ok');
