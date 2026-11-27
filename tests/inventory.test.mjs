import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {listings,references} from '../scripts/inventory-manifest.mjs';
import {validateCatalogue,filterProducts,enquiryMessage} from '../src/catalogue.js';
import {selectedVariant} from '../src/variants.js';
import {shirtMeasurements} from '../src/size-guide.js';
const data=JSON.parse(await fs.readFile('public/catalogue.json','utf8'));
const frames=JSON.parse(await fs.readFile('src/inventory-frames.json','utf8'));
test('all source photos are accounted for, including two sizing references',()=>{
 const seen=new Set([...references,...listings.flatMap(p=>p.options.flatMap(o=>o.photos))]);
 assert.deepEqual([...seen].sort((a,b)=>a-b),Array.from({length:287},(_,i)=>i+1));
});
test('real inventory validates, has correct price tiers and shared sizing',()=>{
 assert.deepEqual(validateCatalogue(data),[]);assert.equal(data.products.length,83);assert.equal(data.previewMode,false);
 for(const p of data.products){assert.equal(p.placeholder,false);for(const v of p.variants){
  assert.equal(v.price,p.category==='Caps'?(p.collection==='Special livery'?35.9:24.9):(p.collection==='Special livery'?59.9:39.9));
  if(p.category==='Shirts')assert.deepEqual(v.sizes,shirtMeasurements.map(r=>r[0]));
  for(const src of v.images){assert.ok(frames[src]);const f=frames[src];assert.ok(f.top>=0&&f.top+f.frameHeight<=f.height);}
 }}
});
test('driver number enquiry and team/type filters preserve exact selection',()=>{
 const p=data.products.find(p=>p.id==='ferrari-team-driver-number-cap');
 assert.match(enquiryMessage(selectedVariant(p,'white-44'),'One size'),/White · #44.*24.90.*white-44/);
 const results=filterProducts(data.products,{brand:'Mercedes',category:'Shirts',query:'',saved:[]});
 assert.equal(results.length,4);assert.ok(results.every(p=>p.brand==='Mercedes'&&p.category==='Shirts'));
});
test('optimised static photos remain below the 20 MB import budget',async()=>{
 let bytes=0;for(const src of Object.keys(frames))bytes+=(await fs.stat('public'+src)).size;
 assert.ok(bytes<20000000);assert.equal(Object.keys(frames).length,285);
});
