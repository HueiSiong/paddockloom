import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.TEST_URL||'http://127.0.0.1:5173';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(base);await page.locator('.product-card').first().waitFor();
 assert.equal(await page.locator('.product-card').count(),83);
 assert.equal(await page.locator('.preview-strip').count(),0);
 for(const team of ['Alpine','Aston Martin','Audi','Cadillac','Ferrari','Haas','McLaren','Mercedes','Red Bull','Williams']){
  await page.locator(`[data-brand="${team}"]`).click();assert.ok(await page.locator('.product-card').count()>0);
  assert.ok((await page.locator('.product-subtitle').allTextContents()).every(t=>t.includes(team)));
 }
 await page.locator('[data-brand="Ferrari"]').click();await page.locator('[data-category="Caps"]').click();
 await page.locator('[data-product="ferrari-team-driver-number-cap"]').first().click();
 await page.locator('[data-variant="white-44"]').click();assert.match(await page.locator('.detail-price').innerText(),/24.90/);
 assert.match(await page.locator('#detail-image').getAttribute('src'),/p129/);
 await page.evaluate(()=>{window.open=url=>{window.__enquiryUrl=url;return null;};});
 await page.locator('#product-dialog [data-channel="whatsapp"]').click();
 const url=new URL(await page.evaluate(()=>window.__enquiryUrl));assert.equal(url.pathname,'/6586932808');assert.match(url.searchParams.get('text'),/White · #44.*24.90/);
 await page.reload();await page.locator('#product-dialog[open]').waitFor();assert.match(await page.locator('.detail-subtitle').innerText(),/White · #44/);
 await page.locator('[data-action="zoom"]').click();assert.equal(await page.locator('#zoom-dialog .product-photo').count(),1);await page.keyboard.press('Escape');await page.keyboard.press('Escape');
 await page.locator('[data-brand="Mercedes"]').click();await page.locator('[data-category="Shirts"]').click();assert.equal(await page.locator('.product-card').count(),4);
 await page.locator('[data-product="mercedes-blue-livery-shirt"]').first().click();assert.match(await page.locator('.detail-price').innerText(),/59.90/);
 await page.locator('.size-guide summary').click();assert.equal(await page.locator('.size-guide tbody tr').count(),7);
 await page.locator('input[name="size"][value="2XL"]').check();
 await page.locator('.thumbnails button').nth(1).click();assert.match(await page.locator('#detail-image').getAttribute('src'),/p244/);
 await page.screenshot({path:'test-results/inventory-desktop.png'});
 await page.setViewportSize({width:390,height:844});assert.equal(await page.locator('#product-dialog').evaluate(d=>d.scrollWidth<=d.clientWidth),true);
 await page.screenshot({path:'test-results/inventory-mobile.png'});
 await page.keyboard.press('Escape');await page.locator('[data-brand="Ferrari"]').click();await page.locator('#collection').scrollIntoViewIfNeeded();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await page.screenshot({path:'test-results/inventory-catalogue-mobile.png'});
 const images=await page.locator('.product-card img').evaluateAll(imgs=>imgs.filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.src));assert.deepEqual(images,[]);assert.deepEqual(errors,[]);
 await page.goto(base+'/studio');
 if(await page.locator('#login-form').count()){
  const {key}=JSON.parse(await fs.readFile('.local/admin-secrets.json','utf8'));
  await page.locator('#admin-key').fill(key);await page.locator('#login-form button').click();
 }
 await page.locator('#studio-search').waitFor();assert.equal(await page.locator('.studio-product').count(),83);
 await page.locator('#studio-search').fill('mercedes');assert.equal(await page.locator('.studio-product').count(),16);
 await page.locator('#studio-search').fill('Mercedes Blue Livery Shirt');assert.equal(await page.locator('.studio-product').count(),1);
 await page.locator('.studio-product').click();assert.equal(await page.locator('[name="price"]').inputValue(),'59.9');
 assert.equal(await page.locator('[name="sizes"]').inputValue(),'S, M, L, XL, 2XL, 3XL, 4XL');
 await page.screenshot({path:'test-results/inventory-studio-mobile.png'});
 assert.deepEqual(errors,[]);
 console.log('Inventory browser checks passed: ten teams, categories, driver variants, exact prices, WhatsApp, sizing, galleries, deep links and mobile layout.');
}finally{await browser.close();}
