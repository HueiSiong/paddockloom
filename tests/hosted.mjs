import { chromium } from '@playwright/test';
import { readFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.TEST_URL||'http://127.0.0.1:8787';
const {key}=JSON.parse(await readFile('.local/admin-secrets.json','utf8'));
const browser=await chromium.launch({channel:'chrome',headless:true});
const admin=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
const customer=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
const page=await admin.newPage(),shop=await customer.newPage();
const errors=[];for(const p of [page,shop])p.on('pageerror',e=>errors.push(e.message));
let original;
try{
  assert.equal((await customer.request.get(base+'/__studio/catalogue')).status(),401);
  assert.equal((await customer.request.post(base+'/__studio/image',{data:{base64:'xxx'},headers:{Origin:base}})).status(),401);
  await page.goto(base+'/admin');await page.locator('#login-form').waitFor();
  await page.locator('#admin-key').fill(key);await page.locator('#login-form button').click();await page.locator('#product-form').waitFor();
  assert.equal(await page.locator('.studio-product').count(),4);
  const originalResponse=await admin.request.get(base+'/__studio/catalogue');original=await originalResponse.json();
  const revision=originalResponse.headers()['x-catalogue-revision'];
  await shop.goto(base);await shop.locator('.product-card').first().waitFor();
  await page.locator('[name="price"]').fill('51.50');
  await page.locator('#save-catalogue').click();await page.waitForFunction(()=>document.querySelector('#studio-status').textContent.startsWith('Saved online'));
  await shop.waitForFunction(()=>document.querySelector('.product-title-row').textContent.includes('$51.50'),{},{timeout:22000});
  const stale=await admin.request.post(base+'/__studio/catalogue',{data:original,headers:{Origin:base,'If-Match':revision}});assert.equal(stale.status(),409);
  const forbidden=await admin.request.post(base+'/__studio/catalogue',{data:original,headers:{Origin:'https://example.com','If-Match':revision}});assert.equal(forbidden.status(),403);
  const upload=page.waitForResponse(r=>r.url().endsWith('/__studio/image')&&r.request().method()==='POST');
  await page.locator('#image-upload').setInputFiles('public/images/cap-black.webp');
  const uploaded=await upload;assert.equal(uploaded.status(),200);const {path}=await uploaded.json();
  const photo=await customer.request.get(base+path);assert.equal(photo.status(),200);assert.equal(photo.headers()['content-type'],'image/webp');assert.ok((await photo.body()).length>1000);
  await page.waitForFunction(()=>document.querySelectorAll('.studio-images img').length===2);
  await page.locator('#save-catalogue').click();await page.waitForFunction(()=>document.querySelector('#studio-status').textContent.startsWith('Saved online'));
  await page.locator('#add-product').click();await page.locator('[name="name"]').fill('Verification piece');
  await page.locator('#save-catalogue').click();await page.waitForFunction(()=>document.querySelector('#studio-status').textContent.startsWith('Saved online'));
  await shop.reload();await shop.locator('.product-card').first().waitFor();assert.equal(await shop.locator('.product-card').count(),5);
  page.once('dialog',dialog=>dialog.accept());await page.locator('#delete-product').click();
  await page.locator('#save-catalogue').click();await page.waitForFunction(()=>document.querySelector('#studio-status').textContent.startsWith('Saved online'));
  assert.equal((await (await admin.request.get(base+'/catalogue.json')).json()).products.length,4);
  await mkdir('test-results',{recursive:true});await page.screenshot({path:'test-results/online-studio.png',fullPage:true});
  const current=await admin.request.get(base+'/__studio/catalogue');
  const restored=await admin.request.post(base+'/__studio/catalogue',{data:original,headers:{Origin:base,'If-Match':current.headers()['x-catalogue-revision']}});assert.equal(restored.status(),200);original=null;
  await page.locator('#sign-out').click();await page.locator('#login-form').waitFor();assert.equal((await admin.request.get(base+'/__studio/catalogue')).status(),401);
  assert.deepEqual(errors,[]);
  console.log('Hosted checks passed: authentication, protected writes, photo upload/read, SGD cents, automatic live refresh, add/remove listings, stale-write conflicts, CSRF and logout. Original catalogue restored.');
}finally{
  if(original){const r=await admin.request.get(base+'/__studio/catalogue');if(r.ok())await admin.request.post(base+'/__studio/catalogue',{data:original,headers:{Origin:base,'If-Match':r.headers()['x-catalogue-revision']}});}
  await browser.close();
}
