import sharp from 'sharp';
import { mkdir, readFile } from 'node:fs/promises';
await mkdir('public/images',{recursive:true});
const assets=JSON.parse(await readFile('.local/asset-sources.json','utf8'));
for(const {name,path} of assets){await sharp(path).resize({width:name==='hero'?2000:1000,withoutEnlargement:true}).webp({quality:name==='hero'?86:88}).toFile(`public/images/${name}.webp`);console.log(`Optimised ${name}`);}
