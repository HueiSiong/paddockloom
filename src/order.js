import {selectedVariant,variants} from './variants.js';
import {money} from './catalogue.js';
export function orderSummary(lines,products){
 const items=[];const unavailable=[];
 for(const line of Array.isArray(lines)?lines:[]){
  const base=products.find(p=>p.id===line.productId);
  if(!base||!variants(base).some(v=>v.id===line.variantId)){unavailable.push(line);continue;}
  const product=selectedVariant(base,line.variantId);
  if(!product.sizes.includes(line.size)||!['in-stock','low-stock'].includes(product.status)){unavailable.push(line);continue;}
  const quantity=Math.max(1,Math.min(99,Math.trunc(Number(line.quantity)||1)));
  const unitCents=Math.round(product.price*100);
  items.push({...line,quantity,product,unitCents,lineCents:unitCents*quantity});
 }
 const quantity=items.reduce((n,p)=>n+p.quantity,0),subtotalCents=items.reduce((n,p)=>n+p.lineCents,0);
 const discountCents=quantity>=3?Math.round(subtotalCents*.1):0;
 return {items,unavailable,quantity,subtotalCents,discountCents,totalCents:subtotalCents-discountCents,freeShipping:quantity>=2};
}
export function orderMessage(summary){
 const lines=summary.items.map((p,i)=>`${i+1}. ${p.product.name}\n${p.product.color} / ${p.size}\nQty ${p.quantity} × ${money(p.unitCents/100)} = ${money(p.lineCents/100)}`);
 return `Hi PADDOCKLOOM, I'd like to order:\n\n${lines.join('\n\n')}\n\nSubtotal: ${money(summary.subtotalCents/100)} SGD${summary.discountCents?`\n10% discount: -${money(summary.discountCents/100)}`:''}\nShipping: ${summary.freeShipping?'Free':'Please confirm delivery cost'}\n${summary.freeShipping?'Total':'Total before shipping'}: ${money(summary.totalCents/100)} SGD\n\nPlease confirm availability and delivery. Thank you.`;
}
