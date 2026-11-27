import { readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { validateCatalogue } from '../src/catalogue.js';
const data = JSON.parse(await readFile('public/catalogue.json','utf8'));
const errors = validateCatalogue(data);
for (const p of data.products) for (const image of new Set([...p.images,...(p.variants||[]).flatMap(v=>v.images)])) { try { await access(resolve('public',image.slice(1))); } catch { errors.push(`${p.name}: missing image ${image}`); } }
try { await access('public/images/hero.webp'); } catch { errors.push('Missing hero image.'); }
if(errors.length){console.error(errors.join('\n'));process.exit(1);}
console.log(`Catalogue valid: ${data.products.length} products; all images present.`);
