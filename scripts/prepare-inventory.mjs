import fs from 'node:fs/promises';
import sharp from 'sharp';
import assert from 'node:assert/strict';
import {listings,references} from './inventory-manifest.mjs';
import {validateCatalogue} from '../src/catalogue.js';
import {syncCover} from '../src/variants.js';
const records=JSON.parse(await fs.readFile('.local/inventory-review/index.json','utf8'));
const before=JSON.parse(await fs.readFile('.local/inventory-import/before.json','utf8'));
const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const used=new Set(listings.flatMap(p=>p.options.flatMap(v=>v.photos)));
assert.deepEqual(records.filter(r=>!used.has(r.index)&&!references.includes(r.index)),[],'Every source must be accounted for');
const frames={};let total=0;
await fs.mkdir('public/images/inventory',{recursive:true});
// Owner explicitly authorised standard cropping/compression on 27 November 2026.
// Remove screenshot UI permanently; do not redraw product details or logos.
for(const index of [...used].sort((a,b)=>a-b)){
 const source=records.find(r=>r.index===index);
 const {data,info}=await sharp(source.file).rotate().removeAlpha().raw().toBuffer({resolveWithObject:true});
 const {width:w,height:h,channels:c}=info;
 let top=Math.round(h*.235);
 for(let y=Math.floor(h*.15);y<Math.floor(h*.48);y++){
  let sum=0,n=0;for(let x=Math.floor(w*.05);x<w*.95;x+=3){const k=(y*w+x)*c;sum+=Math.max(data[k],data[k+1],data[k+2]);n++;}
  if(sum/n>20){top=y;break;}
 }
 // Promo and reference artwork may have a taller frame; preserve its full panel.
 let height=w;
 if(index===144){top=Math.round(h*.1922);height=Math.round(h*.617);}
 if(index===170)top=Math.round(h*.2695);
 if(index===285){top=Math.round(h*.193);height=Math.round(h*.605);}
 // Dark promotional panels start at the same square boundary as adjacent photos.
 if([145,146,147,148,149,150,151,152,153,154].includes(index))top=Math.round(h*.235);
 const src=`/images/inventory/p${String(index).padStart(3,'0')}.webp`;
 const buffer=await sharp(source.file).rotate().extract({left:0,top,width:w,height}).resize({width:700,withoutEnlargement:true}).webp({quality:82,effort:5}).toBuffer();
 await fs.writeFile('public'+src,buffer);total+=buffer.length;
 const cropped=await sharp(buffer).metadata();
 frames[src]={width:cropped.width,height:cropped.height,top:0,frameHeight:cropped.height};
}
await fs.writeFile('src/inventory-frames.json',JSON.stringify(frames));
const colors={'black':'#202124','white':'#eeeeeb','navy':'#172943','blue':'#1765b3','royal':'#245ac2','red':'#c82435','yellow':'#e5bd28','cream':'#ded8c7','lime':'#c8df3d','green':'#147a69','grey':'#83858a','taupe':'#9c9184','pink':'#e97ea5','papaya':'#ef8b25','purple':'#563487','turquoise':'#44c9c5','light':'#75bdde','pale':'#b9d8e7'};
const hex=label=>colors[label.toLowerCase().split(/[ /·]/)[0]]||'#333333';
const shirtSizes=['S','M','L','XL','2XL','3XL','4XL'];
const products=listings.map((p,i)=>{
 const cap=p.category==='Caps',price=cap?(p.special?35.90:24.90):(p.special?59.90:39.90);
 const product={id:slug(p.name),name:p.name,brand:p.brand,category:p.category,collection:p.special?'Special livery':'Standard collection',subtitle:`${p.brand} / ${p.category}`,badge:p.special?'SPECIAL LIVERY':'',placeholder:false,featured:i===0||['Ferrari Team & Driver Number Cap','Mercedes Team T-Shirt','McLaren Driver Number Shirt','Williams Sunset Livery Shirt'].includes(p.name),description:`${p.name}. ${p.special?'A distinctive graphic or alternate-livery design for your race-weekend wardrobe.':'Team-inspired race-weekend style, available in the pictured options.'} Choose your colour and design below; any driver number is shown in the option name.`,details:[`Price: SGD ${price.toFixed(2)} per ${cap?'cap':'shirt'}.`,'The selected option identifies the colour and any driver number. Photos may show front and back views together; the price is for one item.',cap?'One size; confirm the fit and fastening before ordering.':'Sizes S–4XL use the shared Mercedes sizing reference. Confirm measurements for your chosen design before ordering.','Confirm availability and delivery directly on WhatsApp.'],carousellUrl:'',variants:p.options.map(o=>({id:slug(o.label),color:o.label,colorHex:hex(o.label),price,status:'in-stock',sizes:cap?['One size']:shirtSizes,images:[...new Set(o.photos)].map(n=>`/images/inventory/p${String(n).padStart(3,'0')}.webp`),carousellUrl:''}))};
 syncCover(product);return product;
});
const brandNames=[...new Set(products.map(p=>p.brand))];
const retained=before.products.filter(p=>!p.placeholder&&!products.some(q=>q.id===p.id));
const data={...before,previewMode:false,contact:{...before.contact,whatsapp:'6586932808'},brands:[...new Set([...brandNames,...retained.map(p=>p.brand||'Independent')])],productTypes:[...new Set(['Caps','Shirts',...retained.map(p=>p.category)])],products:[...products,...retained]};
assert.deepEqual(validateCatalogue(data),[]);
assert.ok(Buffer.byteLength(JSON.stringify(data))<450000,'Keep catalogue under the 500 KB API limit');
await fs.writeFile('.local/inventory-import/draft.json',JSON.stringify(data,null,2));
await fs.mkdir('tests/fixtures',{recursive:true});
try{await fs.copyFile('public/catalogue.json','tests/fixtures/demo-catalogue.json',fs.constants.COPYFILE_EXCL);}catch(e){if(e.code!=='EEXIST')throw e;}
await fs.writeFile('public/catalogue.json',JSON.stringify(data,null,2));
const report={sourcePhotos:records.length,referenceCharts:references,products:products.length,variants:products.reduce((n,p)=>n+p.variants.length,0),imageFiles:used.size,staticImageBytes:total,catalogueBytes:Buffer.byteLength(JSON.stringify(data)),teams:brandNames.map(brand=>({brand,products:products.filter(p=>p.brand===brand).length})),pricing:'Standard caps 24.90; special livery caps 35.90; standard shirts 39.90; special livery shirts 59.90. Graphic/gradient designs classified by visual review; no unverified race-edition names.',sizing:'S–4XL from Mercedes photo_9 (index 241). Other chart (235) has clipped size labels and is not used for size mapping.'};
await fs.writeFile('.local/inventory-import/report.json',JSON.stringify(report,null,2));
await fs.writeFile('.local/inventory-import/review.csv','Team,Product,Collection,Option,Price SGD,Source photo indices\n'+listings.flatMap((p,i)=>p.options.map(o=>[p.brand,p.name,products[i].collection,o.label,products[i].price,o.photos.join(' / ')].map(x=>'"'+String(x).replaceAll('"','""')+'"').join(','))).join('\n'));
console.log(JSON.stringify(report,null,2));
