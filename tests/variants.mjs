import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.TEST_URL||'http://127.0.0.1:8787';
const {key}=JSON.parse(await readFile('.local/admin-secrets.json','utf8'));
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext();const page=await context.newPage();let original;
try{
 await page.goto(base+'/admin');await page.locator('#login-form').waitFor();await page.locator('#admin-key').fill(key);await page.locator('#login-form button').click();await page.locator('#product-form').waitFor();
 original=await (await context.request.get(base+'/__studio/catalogue')).json();
 await page.locator('#type-list').fill('Caps\nApparel\nScale models\nAccessories');await page.locator('#type-list').blur();
 await page.locator('[name="brand"]').selectOption('McLaren');await page.locator('[name="category"]').selectOption('Accessories');
 await page.locator('#add-colour').click();await page.locator('[name="color"]').fill('Papaya test');await page.locator('[name="price"]').fill('59.50');await page.locator('[name="status"]').selectOption('low-stock');
 await page.locator('[data-remove-image="0"]').click();await page.locator('#image-upload').setInputFiles('public/images/cap-orange.webp');await page.waitForFunction(()=>document.querySelectorAll('.studio-images img').length===1&&!document.querySelector('#save-catalogue').disabled);
 await page.locator('#save-catalogue').click();await page.waitForFunction(()=>document.querySelector('#studio-status').textContent.startsWith('Saved online'));
 const saved=await (await context.request.get(base+'/catalogue.json')).json();assert.equal(saved.products[0].variants.length,2);assert.equal(saved.products[0].variants[1].price,59.5);assert.equal(saved.products[0].brand,'McLaren');
 const shop=await context.newPage();await shop.goto(base);await shop.locator('[data-brand="McLaren"]').click();await shop.locator('[data-category="Accessories"]').click();assert.equal(await shop.locator('.product-card').count(),1);
 await shop.locator('[data-product]').first().click();await shop.locator('.colour-choice').filter({hasText:'Papaya test'}).click();assert.match(await shop.locator('.detail-price').innerText(),/59.50/);assert.match(await shop.locator('#detail-image').getAttribute('src'),/upload-/);
 await shop.locator('#product-dialog [data-channel="whatsapp"]').click();assert.match(await shop.locator('#enquiry-message').inputValue(),/Papaya test.*59.50/);await shop.keyboard.press('Escape');
 const url=shop.url();await shop.reload();await shop.locator('#product-dialog[open]').waitFor();assert.match(await shop.locator('.detail-subtitle').innerText(),/Papaya test/);
 await shop.setViewportSize({width:390,height:844});assert.equal(await shop.locator('#product-dialog').evaluate(d=>d.scrollWidth<=d.clientWidth),true);
 await shop.screenshot({path:'test-results/variants-mobile.png'});
 console.log('Variants passed: editable taxonomy, brand/type filtering, colour-specific upload, pricing, stock, enquiry, deep link and mobile layout.');
}finally{
 if(original){const r=await context.request.get(base+'/__studio/catalogue');const result=await context.request.post(base+'/__studio/catalogue',{headers:{Origin:base,'If-Match':r.headers()['x-catalogue-revision']},data:original});assert.equal(result.status(),200);}
 await browser.close();
}
