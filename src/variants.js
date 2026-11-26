export const variantFields=['color','colorHex','price','status','sizes','images','carousellUrl'];
export const productTypes=data=>data.productTypes||[...new Set(['Caps','Apparel','Scale models',...data.products.map(p=>p.category)])];
export const brands=data=>data.brands||[...new Set(['Independent','Mercedes','McLaren','Red Bull',...data.products.map(p=>p.brand||'Independent')])];
export function variants(p){return p.variants?.length?p.variants:[{id:'original',...Object.fromEntries(variantFields.map(k=>[k,p[k]]))}];}
export function selectedVariant(p,id){const v=variants(p).find(v=>v.id===id)||variants(p)[0];return {...p,...v,id:p.id,variantId:v.id,carousellUrl:v.carousellUrl||p.carousellUrl||''};}
export function minPrice(p){return Math.min(...variants(p).map(v=>v.price));}
export function normalise(data){data.productTypes=productTypes(data);data.brands=brands(data);for(const p of data.products){p.brand||='Independent';p.variants=variants(p);syncCover(p);}return data;}
export function syncCover(p){if(p.variants?.length)for(const k of variantFields)p[k]=structuredClone(p.variants[0][k]??(k==='carousellUrl'?'':p[k]));}
