import fs from 'node:fs/promises';
import sharp from 'sharp';
// Normalised crop rectangles, reviewed against the original product photographs.
// Remove supplier captions, style codes and promotional margins; retain garment/cap branding.
const crops=new Map();
const range=(start,end,rect)=>{for(let i=start;i<=end;i++)crops.set(i,rect);};
range(1,7,[0,.02,1,.88]);range(8,16,[.025,.03,.92,.86]);range(17,36,[0,.02,1,.88]);
range(37,43,[0,0,1,.925]);range(44,47,[0,.02,1,.88]);range(48,51,[0,0,1,.43]);range(52,53,[0,0,1,.66]);range(54,59,[0,.145,1,.735]);
range(62,65,[0,0,1,1]);crops.set(64,[0,0,1,.93]);crops.set(66,[0,.13,1,.87]);range(67,68,[0,0,1,.92]);
range(72,78,[0,0,1,.89]);range(79,84,[0,.01,.94,.87]);crops.set(85,[0,.44,.49,.49]);range(86,89,[0,.075,1,.81]);
range(90,114,[0,0,1,.91]);range(115,132,[0,0,1,.90]);range(133,135,[0,0,1,.91]);range(136,140,[0,0,1,.925]);crops.set(141,[.16,.26,.53,.64]);range(145,154,[0,0,1,.925]);
range(155,161,[.15,.12,.8,.72]);range(164,165,[0,0,1,.925]);range(166,169,[0,0,1,.93]);range(173,177,[0,0,1,.90]);range(178,183,[0,0,1,.92]);range(185,190,[0,0,1,.925]);range(191,196,[0,0,1,.90]);
crops.set(197,[.035,.13,.93,.75]);range(198,201,[0,0,1,.90]);range(202,232,[0,0,1,.86]);range(236,239,[0,0,1,.925]);crops.set(240,[0,.14,1,.86]);
range(246,253,[0,0,1,.91]);range(255,262,[0,0,1,.925]);crops.set(263,[0,.15,.59,.78]);crops.set(264,[0,.22,.55,.70]);crops.set(265,[.01,.20,.56,.72]);crops.set(266,[.01,.10,.57,.82]);crops.set(267,[.01,.22,.57,.70]);crops.set(268,[.01,.19,.58,.73]);crops.set(269,[0,0,1,.93]);crops.set(270,[.01,.08,.58,.86]);range(271,282,[.12,.27,.82,.64]);
const source='public/images/inventory';
const files=(await fs.readdir(source)).filter(f=>/^p\d+\.webp$/.test(f)).sort();
await fs.mkdir('public/images/clean',{recursive:true});
const report=[];const dimensions={};let bytes=0;
for(const file of files){
 const n=Number(file.match(/\d+/)[0]);const buffer=await fs.readFile(`${source}/${file}`);const meta=await sharp(buffer).metadata();
 let input=buffer;
 // Exclude supplier graphics from empty white margins without redrawing the products.
 const margins=[];
 if(n>=198&&n<=201)margins.push([0,0,.34,.32]);
 if([62,63,65].includes(n))margins.push([0,0,.28,.11]);
 if(n===64)margins.push([0,0,.235,.095],[0,.10,.18,.145]);
 if(n>=115&&n<=132)margins.push([0,0,.105,.28],[.94,0,.06,.24]);
 if(margins.length)input=await sharp(buffer).composite(margins.map(([x,y,w,h])=>({input:{create:{width:Math.ceil(meta.width*w),height:Math.ceil(meta.height*h),channels:3,background:'#ffffff'}},left:Math.floor(meta.width*x),top:Math.floor(meta.height*y)}))).png().toBuffer();
 const r=crops.get(n)||[0,0,1,1],left=Math.floor(r[0]*meta.width),top=Math.floor(r[1]*meta.height);
 const width=Math.min(meta.width-left,Math.floor(r[2]*meta.width)),height=Math.min(meta.height-top,Math.floor(r[3]*meta.height));
 const cleaned=await sharp(input).extract({left,top,width,height}).webp({quality:90,effort:5}).toBuffer();
 const path=`/images/clean/${file}`;await fs.writeFile('public'+path,cleaned);bytes+=cleaned.length;
 dimensions[path]={width,height,top:0,frameHeight:height};report.push({file,crop:r,excludedMargins:margins});
}
await fs.writeFile('src/inventory-frames.json',JSON.stringify(dimensions));
await fs.writeFile('.local/shop-refresh/photo-review.json',JSON.stringify({photos:files.length,bytes,report},null,2));
console.log(`Prepared ${files.length} cleaned photos: ${(bytes/1000000).toFixed(2)} MB.`);
