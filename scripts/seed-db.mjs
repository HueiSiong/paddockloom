import { readFile, writeFile, mkdir } from 'node:fs/promises';
await mkdir('.local',{recursive:true});
const data=JSON.parse(await readFile('public/catalogue.json','utf8'));
await writeFile('.local/seed.sql',`INSERT OR IGNORE INTO catalogue(id,body,revision) VALUES(1,'${JSON.stringify(data).replaceAll("'","''")}',1);\n`);
console.log('Prepared seed data. Existing online inventory will not be overwritten.');
