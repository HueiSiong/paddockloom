import {escapeHtml as e,money} from './catalogue.js';
import {productPhoto} from './product-photo.js';
import {orderSummary,orderMessage} from './order.js';
const storageKey='paddockloom-order-v1';
let lines=[],getData,toast;
try{const stored=JSON.parse(localStorage.getItem(storageKey)||'[]');if(Array.isArray(stored))lines=stored.filter(x=>x&&typeof x.productId==='string'&&typeof x.variantId==='string'&&typeof x.size==='string').slice(0,100);}catch{}
const key=line=>JSON.stringify([line.productId,line.variantId,line.size]);
function persist(){try{localStorage.setItem(storageKey,JSON.stringify(lines));}catch{}updateOrderCount();}
export function updateOrderCount(){
 if(!getData)return;
 const count=orderSummary(lines,getData().products).quantity;
 document.querySelectorAll('.order-count').forEach(el=>el.textContent=count||'');
 const dialog=document.querySelector('#order-dialog');if(dialog?.open)renderOrder();
}
export function addToOrder(product,size){
 if(!['in-stock','low-stock'].includes(product.status)||!product.sizes.includes(size))return toast('Please choose an available option.');
 const line={productId:product.id,variantId:product.variantId,size,quantity:1};
 const existing=lines.find(x=>key(x)===key(line));
 if(existing)existing.quantity=Math.min(99,(Number(existing.quantity)||1)+1);else lines.push(line);
 persist();toast('Added to your order.');
}
export function openOrder(){renderOrder();const dialog=document.querySelector('#order-dialog');if(!dialog.open)dialog.showModal();document.body.classList.add('dialog-open');}
function renderOrder(){
 const data=getData(),summary=orderSummary(lines,data.products),blocked=!summary.quantity||summary.unavailable.length||data.previewMode;
 document.querySelector('#order-dialog').innerHTML=`<button class="dialog-close icon-button" data-close="order-dialog" aria-label="Close order">×</button><div class="eyebrow orange">PADDOCKLOOM</div><h2 id="order-title">Your order</h2><p class="order-offer">Any 2 items: free shipping.<br>3 or more: free shipping + 10% off your total.</p>${summary.items.length?`<div class="order-items">${summary.items.map(item=>`<article class="order-item">${productPhoto(item.product.images[0],item.product.name)}<div><h3>${e(item.product.name)}</h3><p>${e(item.product.color)} / ${e(item.size)}</p><span>${money(item.unitCents/100)} SGD each</span><div class="order-quantity"><button data-order-action="minus" data-key="${e(key(item))}" aria-label="Decrease quantity" ${item.quantity===1?'disabled':''}>−</button><input type="number" min="1" max="99" value="${item.quantity}" data-order-quantity="${e(key(item))}" aria-label="Quantity for ${e(item.product.name)}"><button data-order-action="plus" data-key="${e(key(item))}" aria-label="Increase quantity" ${item.quantity===99?'disabled':''}>+</button><button class="order-remove" data-order-action="remove" data-key="${e(key(item))}">Remove</button></div></div><strong>${money(item.lineCents/100)}</strong></article>`).join('')}</div>`:'<p class="order-empty">Your order is empty. Add a cap or shirt to get started.</p>'}${summary.unavailable.length?'<p class="order-warning">Some saved items are no longer available in the selected option. <button data-order-action="clear-unavailable">Remove unavailable items</button></p>':''}${summary.quantity?`<dl class="order-totals"><div><dt>Subtotal (${summary.quantity} items)</dt><dd>${money(summary.subtotalCents/100)}</dd></div>${summary.discountCents?`<div class="order-discount"><dt>10% discount</dt><dd>−${money(summary.discountCents/100)}</dd></div>`:''}<div><dt>Shipping</dt><dd>${summary.freeShipping?'Free':'Confirmed with your order'}</dd></div><div class="order-total"><dt>${summary.freeShipping?'Total':'Total before shipping'}</dt><dd>${money(summary.totalCents/100)} <small>SGD</small></dd></div></dl><p class="order-progress">${summary.quantity===1?'Add 1 more item for free shipping.':summary.quantity===2?'Add 1 more item for 10% off your total.':'Your order qualifies for free shipping and 10% off.'}</p><div class="order-send"><button class="button button-orange" data-order-action="whatsapp" ${blocked||!data.contact.whatsapp?'disabled':''}>Order on WhatsApp</button>${data.contact.email?`<button class="button button-outline" data-order-action="email" ${blocked?'disabled':''}>Order by email</button>`:''}</div><p class="order-note">Send your order to confirm availability and arrange payment.</p>`:''}<button class="text-button" data-close="order-dialog">Continue shopping</button>`;
}
export function initOrder(options){
 getData=options.getData;toast=options.notify;updateOrderCount();
 document.addEventListener('click',event=>{
  const button=event.target.closest('[data-order-action]');if(!button)return;
  const action=button.dataset.orderAction;
  if(['whatsapp','email'].includes(action)){
   const data=getData(),summary=orderSummary(lines,data.products);if(!summary.quantity||summary.unavailable.length||data.previewMode)return;
   const message=orderMessage(summary);
   if(action==='whatsapp'&&data.contact.whatsapp)window.open(`https://wa.me/${data.contact.whatsapp}?text=${encodeURIComponent(message)}`,'_blank','noopener,noreferrer');
   if(action==='email'&&data.contact.email)location.href=`mailto:${data.contact.email}?subject=${encodeURIComponent('PADDOCKLOOM order')}&body=${encodeURIComponent(message)}`;
   return;
  }
  if(action==='clear-unavailable'){const available=orderSummary(lines,getData().products).items;lines=lines.filter(x=>available.some(a=>key(a)===key(x)));}
  else if(action==='remove')lines=lines.filter(x=>key(x)!==button.dataset.key);
  else{const line=lines.find(x=>key(x)===button.dataset.key);if(line)line.quantity=Math.max(1,Math.min(99,Number(line.quantity)+(action==='plus'?1:-1)));}
  persist();
 });
 document.addEventListener('change',event=>{const input=event.target;if(!input.dataset.orderQuantity)return;const line=lines.find(x=>key(x)===input.dataset.orderQuantity);if(line){line.quantity=Math.max(1,Math.min(99,Math.trunc(Number(input.value)||1)));persist();}});
}
