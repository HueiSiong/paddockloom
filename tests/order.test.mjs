import test from 'node:test';import assert from 'node:assert/strict';
import {orderSummary,orderMessage} from '../src/order.js';
const products=[{id:'cap',name:'Team Cap',variants:[{id:'black',price:24.9,color:'Black',sizes:['One size'],status:'in-stock'}]},{id:'shirt',name:'Team Shirt',variants:[{id:'white',price:39.9,color:'White',sizes:['M','L'],status:'in-stock'}]}];
const cap=q=>({productId:'cap',variantId:'black',size:'One size',quantity:q});
test('one item has no offer and two units qualify for free shipping',()=>{
 const one=orderSummary([cap(1)],products);assert.equal(one.totalCents,2490);assert.equal(one.freeShipping,false);assert.equal(one.discountCents,0);
 const two=orderSummary([cap(2)],products);assert.equal(two.totalCents,4980);assert.equal(two.freeShipping,true);assert.equal(two.discountCents,0);
});
test('three mixed items receive ten percent off and free shipping',()=>{
 const result=orderSummary([cap(2),{productId:'shirt',variantId:'white',size:'M',quantity:1}],products);
 assert.equal(result.quantity,3);assert.equal(result.subtotalCents,8970);assert.equal(result.discountCents,897);assert.equal(result.totalCents,8073);assert.equal(result.freeShipping,true);
 assert.match(orderMessage(result),/10% discount: -\$8.97/);assert.match(orderMessage(result),/Total: \$80.73 SGD/);
});
test('current prices are used and unavailable options do not inflate offers',()=>{
 const changed=structuredClone(products);changed[0].variants[0].price=35.9;
 const result=orderSummary([cap(2),{productId:'shirt',variantId:'white',size:'XS',quantity:1}],changed);
 assert.equal(result.totalCents,7180);assert.equal(result.quantity,2);assert.equal(result.discountCents,0);assert.equal(result.unavailable.length,1);
});
test('discounts round to cents and duplicate quantities cannot become negative',()=>{
 const changed=structuredClone(products);changed[0].variants[0].price=24.95;
 assert.equal(orderSummary([cap(3)],changed).totalCents,6736);
 assert.equal(orderSummary([cap(-5)],products).quantity,1);
});
