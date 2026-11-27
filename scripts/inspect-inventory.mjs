import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
const root='Images', out='.local/inventory-review';
await fs.mkdir(out,{recursive:true});
const files=(await fs.readdir(root,{recursive:true})).filter(f=>/\.jpe?g$/i.test(f)).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
const records=[];const groups=new Map();
for(const file of files){const group=path.dirname(file).replaceAll('\\','/');if(!groups.has(group))groups.set(group,[]);const record={index:records.length+1,file:root+'/'+file.replaceAll('\\','/'),group};records.push(record);groups.get(group).push(record);}
for(const [group,items] of groups){for(let start=0;start<items.length;start+=12){const batch=items.slice(start,start+12),layers=[];for(let i=0;i<batch.length;i++){const r=batch[i],x=(i%3)*360,y=Math.floor(i/3)*340;const b=await sharp(r.file).rotate().resize(354,305,{fit:'inside'}).png().toBuffer();const m=await sharp(b).metadata();layers.push({input:b,left:x+Math.round((360-m.width)/2),top:y});layers.push({input:Buffer.from(`<svg width="360" height="30"><rect width="360" height="30" fill="white"/><text x="10" y="22" font-size="19" fill="black">${r.index}: ${path.basename(r.file).split('_2026')[0]}</text></svg>`),left:x,top:y+305});}await sharp({create:{width:1080,height:Math.ceil(batch.length/3)*340,channels:3,background:'#eeeeee'}}).composite(layers).jpeg({quality:85}).toFile(`${out}/${group.replaceAll('/','-')}-${start/12+1}.jpg`);}}
await fs.writeFile(`${out}/index.json`,JSON.stringify(records,null,2));
console.log(`${records.length} photos indexed; contact sheets in ${out}`);
