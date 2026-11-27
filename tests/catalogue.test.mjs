import test from 'node:test';
import { normalise, selectedVariant } from '../src/variants.js';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { filterProducts, validateCatalogue, purchaseUrl, enquiryMessage, validCarousell, validImage, escapeHtml, money } from '../src/catalogue.js';
const catalogue=JSON.parse(await readFile(new URL('./fixtures/demo-catalogue.json',import.meta.url),'utf8'));
const filters={category:'All',collection:'',query:'',stock:false,savedOnly:false,saved:[],sort:'featured'};
test('colour variants validate, filter by available colours, and preserve enquiry details',()=>{
 const data=normalise(structuredClone(catalogue));const p=data.products[0];p.brand='McLaren';p.variants[0].status='sold-out';
 p.variants.push({...structuredClone(p.variants[0]),id:'papaya',color:'Papaya',price:59.5,status:'in-stock'});
 assert.deepEqual(validateCatalogue(data),[]);
 assert.equal(filterProducts(data.products,{...filters,brand:'McLaren',stock:true,query:'papaya'}).length,1);
 assert.match(enquiryMessage(selectedVariant(p,'papaya'),'Adjustable'),/Papaya.*59.50/);
 p.variants[1].price=-1;assert.ok(validateCatalogue(data).some(e=>e.includes('variant price')));
});
test('the editable catalogue passes the schema',()=>assert.deepEqual(validateCatalogue(catalogue),[]));
test('categories, collection, search, availability and saved filters compose',()=>{
  assert.equal(filterProducts(catalogue.products,{...filters,category:'Caps'}).length,2);
  assert.equal(filterProducts(catalogue.products,{...filters,collection:'Trackside',query:'PAPAYA'}).length,1);
  assert.equal(filterProducts(catalogue.products,{...filters,stock:true}).length,3);
  assert.equal(filterProducts(catalogue.products,{...filters,category:'Scale models',stock:true}).length,0);
  assert.deepEqual(filterProducts(catalogue.products,{...filters,savedOnly:true,saved:['pitlane-tee']}).map(p=>p.id),['pitlane-tee']);
});
test('price sorting is numeric and preserves source inventory order',()=>{
  const source=catalogue.products.map(p=>p.id);
  assert.deepEqual(filterProducts(catalogue.products,{...filters,sort:'price-desc'}).map(p=>p.price),[89,65,48,48]);
  assert.deepEqual(catalogue.products.map(p=>p.id),source);
});
test('SGD prices retain cents',()=>{assert.equal(money(48),'$48');assert.equal(money(48.5),'$48.50');});
test('purchase URLs contain the chosen product, colour, size and price',()=>{
  const contact={whatsapp:'6591234567',carousell:'https://www.carousell.sg/u/example/',email:'shop@example.com'};
  const p=catalogue.products[2];
  const wa=new URL(purchaseUrl('whatsapp',contact,p,'XL'));
  assert.equal(wa.hostname,'wa.me');assert.equal(wa.pathname,'/6591234567');
  assert.match(wa.searchParams.get('text'),/XL, \$65 SGD/);assert.match(wa.searchParams.get('text'),/pitlane-tee/);
  assert.match(purchaseUrl('email',contact,p,'M'),/^mailto:shop@example.com\?/);
  assert.equal(purchaseUrl('carousell',contact,{...p,carousellUrl:'https://www.carousell.sg/p/test-123/'},'M'),'https://www.carousell.sg/p/test-123/');
  assert.equal(purchaseUrl('whatsapp',{whatsapp:''},p,'M'),'');
  assert.match(enquiryMessage(null),/motorsport/);
});
test('unsafe links, invalid prices and duplicate IDs are rejected',()=>{
  const invalid=structuredClone(catalogue);invalid.products[1].id=invalid.products[0].id;invalid.products[0].price=-1;invalid.contact.carousell='https://carousell.sg.evil.test';
  assert.ok(validateCatalogue(invalid).length>=3);
  assert.equal(validCarousell('javascript:alert(1)'),false);
  assert.equal(validImage('/images/../../outside.png'),false);
  assert.equal(validImage('https://external.test/image.png'),false);
  assert.equal(validImage('/images/product-example.webp'),true);
  assert.equal(escapeHtml('<script>"&'), '&lt;script&gt;&quot;&amp;');
});
