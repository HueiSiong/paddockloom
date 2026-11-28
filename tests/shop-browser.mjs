import {chromium} from '@playwright/test';import assert from 'node:assert/strict';
const base=process.env.TEST_URL||'http://127.0.0.1:5173';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(base);await page.locator('.product-card').first().waitFor();
 const catalogue=await(await page.request.get(base+'/catalogue.json')).json();
 assert.equal(catalogue.contact.email,'paddockloom@gmail.com');assert.equal(catalogue.previewMode,false);
 for(const p of catalogue.products){assert.doesNotMatch(p.description+' '+p.details.join(' '),/illustrative|concept|driver number|photos may|reference chart|team-inspired|option name/i);}
 const text=await page.locator('body').innerText();assert.doesNotMatch(text,/illustrative|not affiliated|endorsed by|sponsored by|concept products|No checkout queues|Real conversations/i);
 const subtitles=await page.locator('.product-subtitle').allTextContents();assert.ok(subtitles.every(t=>!t.includes('?')&&!t.includes('�')));
 assert.ok(await page.locator('a[href="mailto:paddockloom@gmail.com"]').count()>0);
 await page.locator('[data-product="alpine-bwt-team-cap"]').first().click();await page.locator('[data-action="add-to-order"]').click();await page.locator('#product-dialog [data-action="order"]').click();
 assert.match(await page.locator('.order-total').innerText(),/24.90/);assert.match(await page.locator('.order-progress').innerText(),/1 more item for free shipping/);
 await page.locator('[data-order-action="plus"]').click();assert.match(await page.locator('.order-total').innerText(),/49.80/);assert.equal(await page.locator('.order-discount').count(),0);assert.match(await page.locator('.order-totals').innerText(),/Shipping\s+Free/);
 await page.locator('#order-dialog [data-close="order-dialog"]').first().click();await page.locator('#product-dialog [data-close="product-dialog"]').click();
 await page.locator('[data-product="mercedes-team-t-shirt"]').first().click();await page.locator('input[name="size"][value="M"]').check();await page.locator('[data-action="add-to-order"]').click();await page.locator('#product-dialog [data-action="order"]').click();
 assert.match(await page.locator('.order-total').innerText(),/80.73/);assert.match(await page.locator('.order-discount').innerText(),/8.97/);
 await page.evaluate(()=>{window.open=url=>{window.__orderUrl=url;return null;};});await page.locator('[data-order-action="whatsapp"]').click();
 const url=new URL(await page.evaluate(()=>window.__orderUrl));assert.equal(url.pathname,'/6586932808');const message=url.searchParams.get('text');assert.match(message,/Qty 2/);assert.match(message,/Black \/ M/);assert.match(message,/10% discount: -\$8.97/);assert.match(message,/Shipping: Free/);assert.match(message,/Total: \$80.73 SGD/);
 assert.equal(await page.locator('[data-order-action="email"]').isVisible(),true);
 await page.screenshot({path:'test-results/shop-order-desktop.png'});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/shop-order-mobile.png'});assert.equal(await page.locator('#order-dialog').evaluate(d=>d.scrollWidth<=d.clientWidth),true);
 await page.reload();await page.locator('.product-card').first().waitFor();if(await page.locator('#product-dialog[open]').count())await page.locator('#product-dialog [data-close="product-dialog"]').click();await page.locator('.order-button').click();assert.match(await page.locator('.order-total').innerText(),/80.73/);
 await page.locator('[data-order-action="remove"]').first().click();assert.equal(await page.locator('.order-discount').count(),0);assert.match(await page.locator('.order-total').innerText(),/39.90/);
 await page.locator('#order-dialog [data-close="order-dialog"]').first().click();await page.locator('#collection').scrollIntoViewIfNeeded();await page.screenshot({path:'test-results/shop-collection-mobile.png'});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(errors,[]);
 console.log('Shop browser checks passed: copy, email, listing labels, mixed order, offer thresholds, exact totals, WhatsApp, persistence and mobile layout.');
}finally{await browser.close();}
