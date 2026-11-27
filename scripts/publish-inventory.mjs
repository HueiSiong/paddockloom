import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {session} from './inventory-session.mjs';
import {validateCatalogue} from '../src/catalogue.js';
const request=await session();
const draft=JSON.parse(await fs.readFile('.local/inventory-import/draft.json','utf8'));
const before=JSON.parse(await fs.readFile('.local/inventory-import/before.json','utf8'));
assert.deepEqual(validateCatalogue(draft),[]);
const currentResponse=await request('/__studio/catalogue'),current=await currentResponse.json();
// Never silently replace edits made during preparation, or reapply an old import.
if(JSON.stringify(current)===JSON.stringify(draft)){console.log('Catalogue already matches this import.');process.exit(0);}
assert.deepEqual(current,before,'Catalogue changed since backup; reconcile before publishing');
const storageBefore=await (await request('/__studio/storage')).json();
assert.ok(storageBefore.bytes<storageBefore.limit,'Existing photo allowance exceeded');
const result=await request('/__studio/catalogue',{method:'POST',headers:{'Content-Type':'application/json','If-Match':currentResponse.headers.get('x-catalogue-revision')},body:JSON.stringify(draft)});
const saved=await result.json();
const actual=await (await request('/catalogue.json')).json();assert.deepEqual(actual,draft);
const storageAfter=await (await request('/__studio/storage')).json();assert.equal(storageAfter.bytes,storageBefore.bytes);
await fs.writeFile('.local/inventory-import/published.json',JSON.stringify({saved,products:actual.products.length,variants:actual.products.reduce((n,p)=>n+p.variants.length,0),storage:storageAfter,publishedAt:new Date().toISOString()},null,2));
console.log(JSON.stringify({saved,products:actual.products.length,photoStorageBytes:storageAfter.bytes,photoStorageLimit:storageAfter.limit}));
