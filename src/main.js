import { productTypes, brands, variants, selectedVariant, minPrice } from './variants.js';
import './style.css';
import {productPhoto} from './product-photo.js';
import {sizeGuide} from './size-guide.js';
import {storeSections} from './store-content.js';
import {initOrder,openOrder,addToOrder,updateOrderCount} from './order-ui.js';
import { escapeHtml as e, money, statuses, filterProducts, enquiryMessage, purchaseUrl, validateCatalogue } from './catalogue.js';

const icons = {
  search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  chat: '<path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.4 0-2.7-.3-3.9-.9L3 21l1.9-5.6A8.5 8.5 0 1 1 21 11.5Z"/><path d="M8.5 8.5c1 4 3 6 7 7"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',
  globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  chevron: '<path d="m7 10 5 5 5-5"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  bag: '<path d="M5 7h14l1 14H4L5 7Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/>',
  copy: '<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
  expand: '<path d="M8 3H3v5M16 3h5v5M3 16v5h5M21 16v5h-5"/>',
};
const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.plus}</svg>`;
const logo = `<span class="brand-mark" aria-hidden="true"><i></i><i></i></span><span>PADDOCKLOOM<span class="brand-period">.</span></span>`;
let data, activeProduct, activeSize, toastTimeout, catalogueEtag, refreshBusy=false;
let saved = [];
try { const stored = JSON.parse(localStorage.getItem('paddockloom-saved') || '[]'); if (Array.isArray(stored)) saved = stored.filter(x => typeof x === 'string'); } catch {}
const state = { category: 'All', brand: '', collection: '', query: '', sort: 'featured', stock: false, savedOnly: false, saved };

async function init() {
  const response = await fetch('/catalogue.json',{cache:'no-store'});
  if (!response.ok) throw new Error('The catalogue could not be loaded.');
  data = await response.json();
  catalogueEtag=response.headers.get('ETag');
  if (validateCatalogue(data).length) throw new Error('The catalogue needs a content check.');
  const params = new URLSearchParams(location.search);
  if (['All', ...productTypes(data)].includes(params.get('category'))) state.category = params.get('category');
  state.query = params.get('q') || '';state.brand=brands(data).includes(params.get('brand'))?params.get('brand'):'';
  document.querySelector('#app').innerHTML = `
    <div class="offer-strip"><a href="#collection">2 items: free shipping <span>3+ items: free shipping + 10% off</span></a></div>
    <header class="header"><a href="/" class="logo" aria-label="PADDOCKLOOM home">${logo}</a>
      <nav class="desktop-nav" aria-label="Main navigation"><a href="#collection" class="active">The collection</a><a href="#story">Our world</a><a href="#how-it-works">How to order</a></nav>
      <div class="header-actions"><span class="locale">SG / SGD</span><button class="icon-button order-button" data-action="order" aria-label="View your order">${icon('bag')}<span class="order-count"></span></button><button class="icon-button" data-action="search" aria-label="Search catalogue">${icon('search')}</button><button class="icon-button saved-button" data-action="saved" aria-label="View saved products">${icon('heart')}<span class="saved-count">${saved.length || ''}</span></button><button class="icon-button menu-button" data-action="menu" aria-label="Open navigation" aria-expanded="false">${icon('menu')}</button></div>
    </header>
    <nav class="mobile-nav" aria-label="Mobile navigation" hidden><a href="#collection">The collection</a><a href="#story">Our world</a><a href="#how-it-works">How to order</a><button data-action="contact">Get in touch</button></nav>
    <main id="main">
      <section class="hero" aria-labelledby="hero-title"><img class="hero-image" src="/images/hero.webp" alt="A black open-wheel racing car in a cinematic, orange-lit pit garage" width="1536" height="1024" fetchpriority="high"><div class="hero-shade"></div>
        <div class="hero-content"><div class="eyebrow"><span class="short-line"></span> MOTORSPORT CULTURE. BEYOND THE CIRCUIT.</div><h1 id="hero-title">DRIVEN BY<br><span>OBSESSION.</span></h1><p>Formula 1 caps and shirts.<br>Shop your team. Wear your colours.</p><a href="#collection" class="button button-light">Explore the collection <span class="button-slashes" aria-hidden="true">//</span></a></div>
        <div class="hero-bottom"><span>FROM THE CIRCUIT. FOR THE EVERYDAY.</span><a href="#collection" class="scroll-cue"><span class="mouse" aria-hidden="true"></span> SCROLL TO EXPLORE</a><span class="hero-location">SINGAPORE <span class="orange">1.3521° N · 103.8198° E</span></span></div>
        <div class="hero-side" aria-hidden="true">INDEPENDENT SPIRIT / RACING DNA</div>
      </section>
      <div class="manifesto-strip"><span>RACING IS A FEELING.</span><span class="orange slashes" aria-hidden="true">//</span><span>WEAR IT EVERYWHERE.</span><span class="orange slashes" aria-hidden="true">//</span><span class="strip-outline">PADDOCK TO PAVEMENT.</span><span class="orange slashes" aria-hidden="true">//</span></div>
      <section id="collection" class="collection section-wrap" aria-labelledby="collection-title"><div class="section-heading"><div><div class="eyebrow orange">THE COLLECTION</div><h2 id="collection-title">Shop the collection.</h2></div><p>Caps, shirts and special-livery designs. Find your team colours.</p></div>
        <div class="brand-navigation"><span class="eyebrow orange">SHOP BY TEAM / BRAND</span><div id="brand-navigation">${brandButtons()}</div></div><div class="catalogue-toolbar"><div class="category-tabs" role="group" aria-label="Product categories">${['All',...productTypes(data)].map(c => `<button class="category-tab ${state.category === c ? 'selected' : ''}" data-category="${e(c)}" aria-pressed="${state.category === c}">${c === 'All' ? 'All products' : e(c)}</button>`).join('')}</div><div class="sort-control"><label for="sort">Sort by</label><select id="sort"><option value="featured">Featured</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="name">Name: A–Z</option></select>${icon('chevron')}</div></div>
        <div class="filter-row"><label class="catalogue-search">${icon('search')}<input id="catalogue-search" type="search" placeholder="Search teams, products or colours" aria-label="Search products" value="${e(state.query)}"></label><div class="collection-select"><label class="sr-only" for="collection-filter">Filter collection</label><select id="collection-filter"><option value="">All collections</option>${[...new Set(data.products.map(p=>p.collection))].map(c=>`<option>${e(c)}</option>`).join('')}</select>${icon('chevron')}</div><label class="stock-toggle"><input id="stock-filter" type="checkbox"><span class="custom-check">${icon('check')}</span> In stock</label><button class="text-button clear-filters" data-action="clear" hidden>Reset filters</button><span id="result-count" aria-live="polite"></span></div>
        <div id="saved-notice" class="saved-notice" hidden>Your saved items <button class="text-button" data-action="saved">Show all products</button></div><div id="product-grid" class="product-grid"></div>
        <div class="catalogue-footnote"><span>${icon('globe')} Singapore-based motorsport shop.</span><span>All prices in SGD</span></div>
      </section>
      ${storeSections(icon,data)}
    <dialog id="product-dialog" class="product-dialog" aria-labelledby="product-title"></dialog>
    <dialog id="search-dialog" class="small-dialog" aria-labelledby="search-title"><button class="dialog-close icon-button" data-close="search-dialog" aria-label="Close search">${icon('close')}</button><div class="eyebrow orange">THE COLLECTION</div><h2 id="search-title">Search the shop</h2><form id="search-form"><label class="search-field">${icon('search')}<input type="search" name="query" placeholder="Try Ferrari, caps or shirts" aria-label="Search catalogue" required></label><button class="button button-orange" type="submit">Search the collection</button></form><p class="muted">Caps and shirts</p></dialog>
    <dialog id="order-dialog" class="order-dialog" aria-labelledby="order-title"></dialog>
    <dialog id="contact-dialog" class="small-dialog" aria-labelledby="contact-title"></dialog>
    <dialog id="info-dialog" class="small-dialog" aria-labelledby="info-title"></dialog>
    <dialog id="zoom-dialog" class="zoom-dialog" aria-label="Enlarged product image"><button class="dialog-close icon-button" data-close="zoom-dialog" aria-label="Close enlarged image">${icon('close')}</button><div id="zoom-photo"></div></dialog>`;
  renderProducts(); bindEvents(); initOrder({getData:()=>data,notify});
  setInterval(refreshCatalogue,15000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshCatalogue();});
  if (params.get('product')) openProduct(params.get('product'), false);
  const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('revealed'); observer.unobserve(entry.target); } }), { threshold: 0.08 });
  document.querySelectorAll('.section-heading, .story-copy, .order-grid article, .statement p').forEach(el=>observer.observe(el));
}

async function refreshCatalogue(){
  if(document.hidden||refreshBusy)return;
  refreshBusy=true;
  try{
    const response=await fetch('/catalogue.json',{cache:'no-store',headers:catalogueEtag?{'If-None-Match':catalogueEtag}:{}});
    if(response.status===304||!response.ok)return;
    const next=await response.json();if(validateCatalogue(next).length)return;
    catalogueEtag=response.headers.get('ETag');if(JSON.stringify(next)===JSON.stringify(data))return;
    const oldProduct=activeProduct,oldSize=activeSize;data=next;if(!brands(data).includes(state.brand))state.brand='';if(!productTypes(data).includes(state.category))state.category='All';
    const collections=[...new Set(data.products.map(p=>p.collection))];if(!collections.includes(state.collection))state.collection='';
    document.querySelector('#collection-filter').innerHTML='<option value="">All collections</option>'+collections.map(c=>`<option ${c===state.collection?'selected':''}>${e(c)}</option>`).join('');
    renderProducts();
    if(oldProduct&&document.querySelector('#product-dialog').open){
      const updated=data.products.find(p=>p.id===oldProduct.id);
      if(!updated){closeDialog('product-dialog');if(document.querySelector('#contact-dialog').open)closeDialog('contact-dialog');notify('This item is no longer available.');}
      else if(JSON.stringify(selectedVariant(updated,oldProduct.variantId))!==JSON.stringify(oldProduct)){
        if(document.querySelector('#contact-dialog').open)closeDialog('contact-dialog');
        openProduct(updated.id,false);
        const radio=[...document.querySelectorAll('input[name="size"]')].find(r=>r.value===oldSize);if(radio){radio.checked=true;activeSize=oldSize;}
        notify('Product information has been updated.');
      }
    }
    updateOrderCount();
  }catch{/* Keep the last successful catalogue during a temporary network interruption. */}
  finally{refreshBusy=false;}
}
function brandButtons(){return ['',...brands(data)].map(b=>`<button class="brand-tab ${state.brand===b?'selected':''}" data-brand="${e(b)}" aria-pressed="${state.brand===b}">${e(b||'All teams')}</button>`).join('');}
function renderProducts() {
  document.querySelector('#brand-navigation').innerHTML=brandButtons();
  document.querySelector('.category-tabs').innerHTML=['All',...productTypes(data)].map(c=>`<button class="category-tab" data-category="${e(c)}">${e(c==='All'?'All products':c)}</button>`).join('');
  const products = filterProducts(data.products, state).map(p=>({...p,status:variants(p).find(v=>['in-stock','low-stock'].includes(v.status))?.status||p.status}));
  document.querySelector('#result-count').textContent = `${products.length} ${products.length === 1 ? 'item' : 'items'}`;
  document.querySelector('#saved-notice').hidden = !state.savedOnly;
  document.querySelector('.clear-filters').hidden = !(state.brand || state.query || state.category !== 'All' || state.collection || state.stock || state.savedOnly);
  document.querySelectorAll('[data-category]').forEach(b => { const selected = b.dataset.category === state.category; b.classList.toggle('selected', selected); b.setAttribute('aria-pressed', selected); });
  document.querySelectorAll('.saved-count').forEach(el => el.textContent = state.saved.length || '');
  document.querySelector('.saved-button').classList.toggle('is-saved', state.savedOnly);
  document.querySelector('#product-grid').innerHTML = products.length ? products.map((p,i)=>`<article class="product-card" style="--card-delay:${(i % 8) * 40}ms"><div class="product-image-wrap"><a class="product-image-link" href="?product=${e(p.id)}" data-product="${e(p.id)}" aria-label="View ${e(p.name)} in ${e(p.color)}">${productPhoto(p.images[0],`${p.name} in ${p.color}`)}<span class="quick-view">View product ${icon('plus')}</span></a><span class="product-badge">${e(p.badge || p.collection)}</span><button class="save-product ${state.saved.includes(p.id) ? 'is-saved' : ''}" data-save="${e(p.id)}" aria-label="${state.saved.includes(p.id) ? 'Unsave' : 'Save'} ${e(p.name)} in ${e(p.color)}" aria-pressed="${state.saved.includes(p.id)}">${icon('heart')}</button></div><div class="product-meta"><span>${e(p.category.toUpperCase())}</span><span class="stock-status ${e(p.status)}">${e(statuses[p.status])}</span></div><div class="product-title-row"><h3><a href="?product=${e(p.id)}" data-product="${e(p.id)}">${e(p.name)}</a></h3><span>${variants(p).some(v=>v.price!==minPrice(p))?'From ':''}${money(minPrice(p))} <small>SGD</small></span></div><div class="product-subtitle"><span>${e(p.brand||'Independent')}</span><span class="listing-option-count">${variants(p).length} option${variants(p).length===1?'':'s'}</span><span class="color-swatch" style="--swatch:${e(p.colorHex)}" title="${e(p.color)}"></span></div></article>`).join('') : `<div class="empty-state">${icon(state.savedOnly ? 'heart' : 'search')}<h3>${state.savedOnly ? 'No saved items yet.' : 'No products found.'}</h3><p>${state.savedOnly ? 'Select the heart on a product to save it.' : 'Try another search or clear your filters.'}</p><button class="button button-light" data-action="clear">Browse products</button></div>`;
}
function syncFilters() { const url = new URL(location); if(state.brand)url.searchParams.set('brand',state.brand);else url.searchParams.delete('brand'); if (state.category !== 'All') url.searchParams.set('category',state.category); else url.searchParams.delete('category'); if (state.query) url.searchParams.set('q',state.query); else url.searchParams.delete('q'); history.replaceState({},'',url); renderProducts(); }
function notify(message) { const t=document.querySelector('#toast'); t.textContent=message; t.showPopover?.(); t.classList.add('visible'); clearTimeout(toastTimeout); toastTimeout=setTimeout(()=>{t.classList.remove('visible');t.hidePopover?.();},3500); }
function showDialog(id) { const d=document.getElementById(id); if (!d.open) d.showModal(); document.body.classList.add('dialog-open'); }
function closeDialog(id) { document.getElementById(id).close(); if (!document.querySelector('dialog[open]')) document.body.classList.remove('dialog-open'); }
function closeProductUrl() { const url=new URL(location); url.searchParams.delete('product');url.searchParams.delete('colour'); history.replaceState({},'',url); activeProduct=null; document.title='PADDOCKLOOM — Driven by obsession.'; }
function openProduct(id, updateUrl=true, colourId) {
  const base=data.products.find(p=>p.id===id);const p=base?selectedVariant(base,colourId||new URLSearchParams(location.search).get('colour')):null; if (!p) { notify('This item is no longer available.'); closeProductUrl(); return; }
  const previousSize=activeSize;activeProduct=p; activeSize=p.sizes.includes(previousSize)?previousSize:p.sizes[0];
  const colourUrl=new URL(location);colourUrl.searchParams.set('colour',p.variantId);history.replaceState({},'',colourUrl);
  if (updateUrl) { const url=new URL(location); url.searchParams.set('product',id); history.pushState({},'',url); }
  document.title=`${p.name} — ${p.color} | PADDOCKLOOM`;
  document.querySelector('#product-dialog').innerHTML=`<button class="dialog-close icon-button" data-close="product-dialog" aria-label="Close product">${icon('close')}</button><div class="product-detail-grid"><div class="detail-gallery"><button class="image-zoom" data-action="zoom" aria-label="Enlarge product image">${productPhoto(p.images[0],`${p.name} — ${p.color}`,'id="detail-image"')}${icon('expand')}</button>${p.images.length>1 ? `<div class="thumbnails">${p.images.map((src,i)=>`<button data-image="${e(src)}" aria-label="View product photo ${i+1}">${productPhoto(src,`Product photo ${i+1}`)}</button>`).join('')}</div>` : ''}<span class="detail-image-note">${e(p.collection.toUpperCase())}</span></div><div class="detail-content"><div class="eyebrow orange">${e(p.collection)} / ${e(p.category)}</div><h2 id="product-title">${e(p.name)}</h2><p class="detail-subtitle">${e(p.color)}</p><div class="detail-price">${money(p.price)} <span>SGD</span><span class="stock-status ${e(p.status)}">${e(statuses[p.status])}</span></div><p>${e(p.description)}</p><fieldset class="colour-options"><legend>Choose colour / design</legend>${variants(base).map(v=>`<button class="colour-choice ${v.id===p.variantId?'selected':''}" data-variant="${e(v.id)}" aria-pressed="${v.id===p.variantId}"><span style="background:${e(v.colorHex)}"></span>${e(v.color)}<small>${e(statuses[v.status])}</small></button>`).join('')}</fieldset><fieldset class="size-options"><legend>${p.category === 'Scale models' ? 'Scale' : 'Select size'}</legend>${p.sizes.map((s,i)=>`<label><input type="radio" name="size" value="${e(s)}" ${s===activeSize?'checked':''}><span>${e(s)}</span></label>`).join('')}</fieldset>${sizeGuide(p.category)}<div class="product-offer">Any 2 items: free shipping.<br>3+ items: free shipping + 10% off.</div><div class="enquiry-actions"><button class="button button-light" data-action="add-to-order" ${['sold-out','coming-soon'].includes(p.status)?'disabled':''}>Add to order</button><button class="text-button" data-action="order">View your order</button><button class="button button-orange" data-channel="whatsapp">${icon('chat')} ${['sold-out','coming-soon'].includes(p.status) ? 'Ask about availability' : 'Enquire on WhatsApp'}</button><div>${purchaseUrl('carousell',data.contact,p,activeSize)?'<button class="button button-outline" data-channel="carousell">View on Carousell</button>':''}${data.contact.email?`<button class="button button-outline" data-channel="email">${icon('mail')} Email us</button>`:''}</div></div><p class="enquiry-note">Questions about this item? Contact us on WhatsApp or email.</p><details open><summary>Product details ${icon('plus')}</summary><ul>${p.details.map(d=>`<li>${e(d)}</li>`).join('')}</ul></details><details><summary>Delivery & ordering ${icon('plus')}</summary><p>Free shipping on orders of 2 or more items. Buy 3 or more and receive 10% off your total. Send your order on WhatsApp or email to arrange delivery and payment.</p></details><button class="text-button share-product" data-action="share">${icon('copy')} Copy product link</button></div></div>`;
  showDialog('product-dialog');
}
function contact(channel) {
  const product = document.querySelector('#product-dialog').open ? activeProduct : null;
  const url=channel ? purchaseUrl(channel,data.contact,product,activeSize) : '';
  if (url && !data.previewMode) { if(channel==='email') location.href=url; else window.open(url,'_blank','noopener,noreferrer'); return; }
  const message=enquiryMessage(product,activeSize);
  document.querySelector('#contact-dialog').innerHTML=`<button class="dialog-close icon-button" data-close="contact-dialog" aria-label="Close enquiry">${icon('close')}</button><div class="eyebrow orange">CONTACT PADDOCKLOOM</div><h2 id="contact-title">How can we help?</h2>${data.previewMode || (channel && !url) ? (data.previewMode ? '<p>Orders are currently paused. Please contact us for assistance.</p>' : '<p>Please contact us using one of the options below.</p>') : '<p>Contact us for product enquiries, sizing help or order updates.</p>'}<label class="enquiry-label" for="enquiry-message">Your enquiry</label><textarea id="enquiry-message" rows="5">${e(message)}</textarea><button class="button button-light" data-action="copy-enquiry">${icon('copy')} Copy enquiry</button><div class="contact-channels">${['whatsapp','carousell','email'].filter(c=>purchaseUrl(c,data.contact,product,activeSize)).map(c=>`<button class="button button-outline" data-channel="${c}" ${data.previewMode || !purchaseUrl(c,data.contact,product,activeSize) ? 'disabled' : ''}>${c==='whatsapp'?'WhatsApp':c==='carousell'?'Carousell':'Email'}</button>`).join('')}</div>`;
  showDialog('contact-dialog');
}
async function copy(text, success) { try { await navigator.clipboard.writeText(text); notify(success); } catch { notify('Copy is unavailable. Select and copy the text or address manually.'); } }
function showInfo(type) {
 const privacy=type==='privacy';
 document.querySelector('#info-dialog').innerHTML=`<button class="dialog-close icon-button" data-close="info-dialog" aria-label="Close information">${icon('close')}</button><div class="eyebrow orange">PADDOCKLOOM</div><h2 id="info-title">${privacy?'Privacy':'Order terms'}</h2>${privacy?'<p>Your saved items and order bag stay in this browser. We do not use advertising cookies or analytics.</p><p>When you contact us on WhatsApp or email, we use the details you provide to answer your enquiry and fulfil your order.</p><button class="text-button" data-action="clear-saved">Clear saved items</button>':'<p>All prices are in Singapore dollars. Orders are confirmed directly through WhatsApp or email before payment.</p><p>Buy any 2 items for free shipping. Buy 3 or more for free shipping and 10% off your total. Items must be ordered together.</p><p>For delivery updates, exchanges or help with your order, email <a href="mailto:paddockloom@gmail.com">paddockloom@gmail.com</a>.</p>'}`;showDialog('info-dialog');
}
function bindEvents() {
  document.addEventListener('click',ev=>{
    const button=ev.target.closest('button,a'); if(!button) return;
    if(button.dataset.product) { ev.preventDefault(); openProduct(button.dataset.product); }
    if(button.dataset.save) { const id=button.dataset.save; state.saved=state.saved.includes(id)?state.saved.filter(s=>s!==id):[...state.saved,id]; try {localStorage.setItem('paddockloom-saved',JSON.stringify(state.saved));}catch{} renderProducts(); document.querySelector(`[data-save="${id}"]`)?.focus({preventScroll:true}); notify(state.saved.includes(id)?'Saved to your favourites.':'Removed from your favourites.'); }
    if(button.dataset.brand!==undefined){state.brand=button.dataset.brand;state.category='All';syncFilters();}
    if(button.dataset.variant){openProduct(activeProduct.id,false,button.dataset.variant);}
    if(button.dataset.category) { state.category=button.dataset.category; syncFilters(); }
    if(button.dataset.close) closeDialog(button.dataset.close);
    if(button.dataset.channel) contact(button.dataset.channel);
    if(button.dataset.image) document.querySelector('#detail-image').closest('.product-photo').outerHTML=productPhoto(button.dataset.image,activeProduct.name+' — '+activeProduct.color,'id="detail-image"');
    const action=button.dataset.action;
    if(action==='search') showDialog('search-dialog');
    if(action==='saved') {state.savedOnly=!state.savedOnly; renderProducts(); document.querySelector('#collection').scrollIntoView({behavior:'smooth'});}
    if(action==='clear') {Object.assign(state,{category:'All',brand:'',collection:'',query:'',stock:false,savedOnly:false,sort:'featured'}); document.querySelector('#catalogue-search').value=''; document.querySelector('#collection-filter').value=''; document.querySelector('#stock-filter').checked=false; document.querySelector('#sort').value='featured'; syncFilters();}
    if(action==='menu') {const nav=document.querySelector('.mobile-nav'); nav.hidden=!nav.hidden; button.setAttribute('aria-expanded',!nav.hidden);}
    if(action==='contact') contact();
    if(action==='order') openOrder();
    if(action==='add-to-order') addToOrder(activeProduct,activeSize);
    if(action==='privacy'||action==='terms') showInfo(action);
    if(action==='clear-saved') {state.saved=[]; try{localStorage.removeItem('paddockloom-saved');}catch{} renderProducts(); notify('Saved products cleared.');}
    if(action==='copy-enquiry') copy(document.querySelector('#enquiry-message').value,'Enquiry copied.');
    if(action==='share') copy(location.href,'Product link copied.');
    if(action==='zoom') {document.querySelector('#zoom-photo').innerHTML=productPhoto(document.querySelector('#detail-image').getAttribute('src'),activeProduct.name+' — '+activeProduct.color); showDialog('zoom-dialog');}
    if(button.closest('.mobile-nav')) {document.querySelector('.mobile-nav').hidden=true;document.querySelector('[data-action="menu"]').setAttribute('aria-expanded','false');}
  });
  document.querySelector('#catalogue-search').addEventListener('input',ev=>{state.query=ev.target.value;syncFilters();});
  document.querySelector('#sort').addEventListener('change',ev=>{state.sort=ev.target.value;renderProducts();});
  document.querySelector('#collection-filter').addEventListener('change',ev=>{state.collection=ev.target.value;syncFilters();});
  document.querySelector('#stock-filter').addEventListener('change',ev=>{state.stock=ev.target.checked;syncFilters();});
  document.querySelector('#search-form').addEventListener('submit',ev=>{ev.preventDefault();state.query=new FormData(ev.target).get('query').trim();state.category='All';state.brand='';state.collection='';state.savedOnly=false;state.stock=false;document.querySelector('#collection-filter').value='';document.querySelector('#stock-filter').checked=false;document.querySelector('#catalogue-search').value=state.query;syncFilters();closeDialog('search-dialog');document.querySelector('#collection').scrollIntoView({behavior:'smooth'});});
  document.querySelector('#product-dialog').addEventListener('change',ev=>{if(ev.target.name==='size')activeSize=ev.target.value;});
  document.querySelectorAll('dialog').forEach(d=>{d.addEventListener('click',ev=>{if(ev.target===d){const r=d.getBoundingClientRect();if(ev.clientX<r.left||ev.clientX>r.right||ev.clientY<r.top||ev.clientY>r.bottom)closeDialog(d.id);}});d.addEventListener('close',()=>{if(d.id==='product-dialog')closeProductUrl();if(!document.querySelector('dialog[open]'))document.body.classList.remove('dialog-open');});});
  window.addEventListener('popstate',()=>{const params=new URLSearchParams(location.search);state.brand=brands(data).includes(params.get('brand'))?params.get('brand'):'';const id=params.get('product');if(id)openProduct(id,false);else if(document.querySelector('#product-dialog').open)closeDialog('product-dialog');state.category=productTypes(data).includes(params.get('category'))?params.get('category'):'All';state.query=params.get('q')||'';document.querySelector('#catalogue-search').value=state.query;renderProducts();});
}
init().catch(error=>{ console.error(error); document.querySelector('#app').innerHTML=`<main class="load-error"><a href="/" class="logo">${logo}</a><h1>A brief pit stop.</h1><p>The catalogue couldn't be loaded. Please refresh to try again.</p><button class="button button-orange" onclick="location.reload()">Try again</button></main>`; });

