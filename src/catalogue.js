import { productTypes, brands, variants, minPrice } from './variants.js';
export const categories = ['Caps', 'Apparel', 'Scale models'];
export const statuses = { 'in-stock': 'In stock', 'low-stock': 'Limited stock', 'sold-out': 'Sold out', 'coming-soon': 'Coming soon' };
export const money = value => new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD', currencyDisplay: 'narrowSymbol', minimumFractionDigits: Number.isInteger(value) ? 0 : 2, maximumFractionDigits: 2 }).format(value);
export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
export function validImage(path) { return typeof path === 'string' && /^\/images\/[a-zA-Z0-9_./-]+\.(webp|png|jpe?g|avif)$/i.test(path) && !path.includes('..'); }
export function validCarousell(url) { if (!url) return true; try { const u = new URL(url); return u.protocol === 'https:' && ['carousell.sg', 'www.carousell.sg', 'carousell.com', 'www.carousell.com'].includes(u.hostname); } catch { return false; } }
export function validateCatalogue(data) {
  const errors = [];
  if (!data || typeof data !== 'object') return ['Catalogue must be an object.'];
  if (typeof data.previewMode !== 'boolean') errors.push('previewMode must be true or false.');
  if (!data.contact || !/^\d{8,15}$|^$/.test(data.contact.whatsapp ?? 'invalid')) errors.push('WhatsApp must be empty or 8–15 digits, including country code.');
  if (!validCarousell(data.contact?.carousell)) errors.push('Use an HTTPS Carousell profile URL.');
  if (data.contact?.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contact.email)) errors.push('Enter a valid email address.');
  if (!Array.isArray(data.products)) return [...errors, 'products must be an array.'];
  for(const key of ['productTypes','brands']) if(data[key]!==undefined && (!Array.isArray(data[key])||!data[key].length||data[key].length>50||data[key].some(x=>typeof x!=='string'||!x.trim()||x.length>60||x==='All')||new Set(data[key].map(x=>String(x).toLowerCase())).size!==data[key].length))errors.push(`${key}: provide 1?50 unique names (up to 60 characters).`);
  const allowedTypes=Array.isArray(data.productTypes)?data.productTypes:categories;
  const ids = new Set();
  for (const p of data.products) {
    const name = p?.name || 'Unnamed product';
    if (!p || typeof p !== 'object') { errors.push('Invalid product.'); continue; }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.id) || ids.has(p.id)) errors.push(`${name}: use a unique lowercase hyphenated ID.`);
    ids.add(p.id);
    for (const key of ['name', 'subtitle', 'collection', 'color', 'description']) if (typeof p[key] !== 'string' || !p[key].trim()) errors.push(`${name}: ${key} is required.`);
    if (!allowedTypes.includes(p.category)) errors.push(`${name}: invalid category.`);
    if (!Object.hasOwn(statuses, p.status)) errors.push(`${name}: invalid stock status.`);
    if (!Number.isFinite(p.price) || p.price < 0) errors.push(`${name}: price must be a positive number or zero.`);
    if (!/^#[a-f0-9]{6}$/i.test(p.colorHex)) errors.push(`${name}: use a six-digit hex colour.`);
    if (!Array.isArray(p.sizes) || !p.sizes.length || p.sizes.some(s => typeof s !== 'string' || !s.trim())) errors.push(`${name}: provide at least one size.`);
    if (!Array.isArray(p.images) || !p.images.length || p.images.some(i => !validImage(i))) errors.push(`${name}: images must be local /images/ paths.`);
    if (!Array.isArray(p.details) || p.details.some(d => typeof d !== 'string')) errors.push(`${name}: details must be a list of text.`);
    if (typeof p.placeholder !== 'boolean' || typeof p.featured !== 'boolean') errors.push(`${name}: placeholder and featured must be true or false.`);
    if(Array.isArray(data.brands) && !data.brands.includes(p.brand||'Independent'))errors.push(`${name}: select a listed team / brand.`);
    if(p.variants!==undefined){
      if(!Array.isArray(p.variants)||!p.variants.length||p.variants.length>30)errors.push(`${name}: provide 1?30 colour variants.`);
      else {const keys=new Set();for(const v of p.variants){
        if(!v||typeof v!=='object'){errors.push(`${name}: invalid variant.`);continue;}
        if(!/^[a-z0-9-]+$/.test(v.id)||keys.has(v.id))errors.push(`${name}: variant IDs must be unique.`);keys.add(v.id);
        if(typeof v.color!=='string'||!v.color.trim()||!/^#[a-f0-9]{6}$/i.test(v.colorHex))errors.push(`${name}: variant colour is required.`);
        if(!Number.isFinite(v.price)||v.price<0||!Object.hasOwn(statuses,v.status))errors.push(`${name}: invalid variant price or stock.`);
        if(!Array.isArray(v.sizes)||!v.sizes.length||v.sizes.some(s=>typeof s!=='string'||!s.trim()))errors.push(`${name}: variant sizes are required.`);
        if(!Array.isArray(v.images)||!v.images.length||v.images.some(i=>!validImage(i)))errors.push(`${name}: each colour needs at least one photo.`);
        if(!validCarousell(v.carousellUrl))errors.push(`${name}: invalid variant Carousell link.`);
      }}
    }
    if (!validCarousell(p.carousellUrl)) errors.push(`${name}: invalid Carousell URL.`);
  }
  return errors;
}
export function filterProducts(products, filters) {
  let result = products.filter(p => (filters.category === 'All' || p.category === filters.category) && (!filters.brand || (p.brand||'Independent')===filters.brand) && (!filters.collection || p.collection === filters.collection) && (!filters.stock || variants(p).some(v=>['in-stock', 'low-stock'].includes(v.status))) && (!filters.savedOnly || filters.saved.includes(p.id)) && (!filters.query || `${p.name} ${p.subtitle} ${p.category} ${p.collection} ${p.brand||''} ${variants(p).map(v=>v.color).join(' ')} ${p.description}`.toLowerCase().includes(filters.query.toLowerCase().trim())));
  if (filters.sort === 'price-asc') result.sort((a, b) => minPrice(a) - minPrice(b));
  if (filters.sort === 'price-desc') result.sort((a, b) => minPrice(b) - minPrice(a));
  if (filters.sort === 'name') result.sort((a, b) => a.name.localeCompare(b.name));
  if (!filters.sort || filters.sort === 'featured') result.sort((a, b) => Number(b.featured) - Number(a.featured));
  return result;
}
export function enquiryMessage(product, size) { return product ? `Hi PADDOCKLOOM, I'm interested in ${product.name} (${product.color}), ${size}, ${money(product.price)} SGD. Product: ${product.id}${product.variantId ? ` / ${product.variantId}` : ''}. Could you confirm availability and delivery options?` : "Hi PADDOCKLOOM, I'd like to find out more about your motorsport collection."; }
export function purchaseUrl(channel, contact, product, size) {
  const message = enquiryMessage(product, size);
  if (channel === 'whatsapp' && contact.whatsapp) return `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(message)}`;
  if (channel === 'carousell') return product?.carousellUrl || contact.carousell || '';
  if (channel === 'email' && contact.email) return `mailto:${contact.email}?subject=${encodeURIComponent(product ? `Enquiry: ${product.name}` : 'PADDOCKLOOM enquiry')}&body=${encodeURIComponent(message)}`;
  return '';
}
