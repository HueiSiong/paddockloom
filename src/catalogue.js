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
  const ids = new Set();
  for (const p of data.products) {
    const name = p?.name || 'Unnamed product';
    if (!p || typeof p !== 'object') { errors.push('Invalid product.'); continue; }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.id) || ids.has(p.id)) errors.push(`${name}: use a unique lowercase hyphenated ID.`);
    ids.add(p.id);
    for (const key of ['name', 'subtitle', 'collection', 'color', 'description']) if (typeof p[key] !== 'string' || !p[key].trim()) errors.push(`${name}: ${key} is required.`);
    if (!categories.includes(p.category)) errors.push(`${name}: invalid category.`);
    if (!Object.hasOwn(statuses, p.status)) errors.push(`${name}: invalid stock status.`);
    if (!Number.isFinite(p.price) || p.price < 0) errors.push(`${name}: price must be a positive number or zero.`);
    if (!/^#[a-f0-9]{6}$/i.test(p.colorHex)) errors.push(`${name}: use a six-digit hex colour.`);
    if (!Array.isArray(p.sizes) || !p.sizes.length || p.sizes.some(s => typeof s !== 'string' || !s.trim())) errors.push(`${name}: provide at least one size.`);
    if (!Array.isArray(p.images) || !p.images.length || p.images.some(i => !validImage(i))) errors.push(`${name}: images must be local /images/ paths.`);
    if (!Array.isArray(p.details) || p.details.some(d => typeof d !== 'string')) errors.push(`${name}: details must be a list of text.`);
    if (typeof p.placeholder !== 'boolean' || typeof p.featured !== 'boolean') errors.push(`${name}: placeholder and featured must be true or false.`);
    if (!validCarousell(p.carousellUrl)) errors.push(`${name}: invalid Carousell URL.`);
  }
  return errors;
}
export function filterProducts(products, filters) {
  let result = products.filter(p => (filters.category === 'All' || p.category === filters.category) && (!filters.collection || p.collection === filters.collection) && (!filters.stock || ['in-stock', 'low-stock'].includes(p.status)) && (!filters.savedOnly || filters.saved.includes(p.id)) && (!filters.query || `${p.name} ${p.subtitle} ${p.category} ${p.collection} ${p.description}`.toLowerCase().includes(filters.query.toLowerCase().trim())));
  if (filters.sort === 'price-asc') result.sort((a, b) => a.price - b.price);
  if (filters.sort === 'price-desc') result.sort((a, b) => b.price - a.price);
  if (filters.sort === 'name') result.sort((a, b) => a.name.localeCompare(b.name));
  if (!filters.sort || filters.sort === 'featured') result.sort((a, b) => Number(b.featured) - Number(a.featured));
  return result;
}
export function enquiryMessage(product, size) { return product ? `Hi PADDOCKLOOM, I'm interested in ${product.name} (${product.color}), ${size}, ${money(product.price)} SGD. Product: ${product.id}. Could you confirm availability and delivery options?` : "Hi PADDOCKLOOM, I'd like to find out more about your motorsport collection."; }
export function purchaseUrl(channel, contact, product, size) {
  const message = enquiryMessage(product, size);
  if (channel === 'whatsapp' && contact.whatsapp) return `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(message)}`;
  if (channel === 'carousell') return product?.carousellUrl || contact.carousell || '';
  if (channel === 'email' && contact.email) return `mailto:${contact.email}?subject=${encodeURIComponent(product ? `Enquiry: ${product.name}` : 'PADDOCKLOOM enquiry')}&body=${encodeURIComponent(message)}`;
  return '';
}
