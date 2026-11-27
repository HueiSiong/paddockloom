import { productTypes, brands, variants, selectedVariant, minPrice } from './variants.js';
import './style.css';
import {productPhoto} from './product-photo.js';
import {sizeGuide} from './size-guide.js';
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
    ${data.previewMode ? '<div class="preview-strip">THE PADDOCKLOOM PREVIEW <span>Concept products & illustrative prices. Real collection coming soon.</span></div>' : ''}
    <header class="header"><a href="/" class="logo" aria-label="PADDOCKLOOM home">${logo}</a>
      <nav class="desktop-nav" aria-label="Main navigation"><a href="#collection" class="active">The collection</a><a href="#story">Our world</a><a href="#how-it-works">How to order</a></nav>
      <div class="header-actions"><span class="locale">SG / SGD</span><button class="icon-button" data-action="search" aria-label="Search catalogue">${icon('search')}</button><button class="icon-button saved-button" data-action="saved" aria-label="View saved products">${icon('heart')}<span class="saved-count">${saved.length || ''}</span></button><button class="icon-button menu-button" data-action="menu" aria-label="Open navigation" aria-expanded="false">${icon('menu')}</button></div>
    </header>
    <nav class="mobile-nav" aria-label="Mobile navigation" hidden><a href="#collection">The collection</a><a href="#story">Our world</a><a href="#how-it-works">How to order</a><button data-action="contact">Get in touch</button></nav>
    <main id="main">
      <section class="hero" aria-labelledby="hero-title"><img class="hero-image" src="/images/hero.webp" alt="A black open-wheel racing car in a cinematic, orange-lit pit garage" width="1536" height="1024" fetchpriority="high"><div class="hero-shade"></div>
        <div class="hero-content"><div class="eyebrow"><span class="short-line"></span> MOTORSPORT CULTURE. BEYOND THE CIRCUIT.</div><h1 id="hero-title">DRIVEN BY<br><span>OBSESSION.</span></h1><p>For the ones who feel every corner.<br>Discover motorsport essentials with a different edge.</p><a href="#collection" class="button button-light">Explore the collection <span class="button-slashes" aria-hidden="true">//</span></a></div>
        <div class="hero-bottom"><span>FROM THE CIRCUIT. FOR THE EVERYDAY.</span><a href="#collection" class="scroll-cue"><span class="mouse" aria-hidden="true"></span> SCROLL TO EXPLORE</a><span class="hero-location">SINGAPORE <span class="orange">1.3521° N · 103.8198° E</span></span></div>
        <div class="hero-side" aria-hidden="true">INDEPENDENT SPIRIT / RACING DNA</div>
      </section>
      <div class="manifesto-strip"><span>RACING IS A FEELING.</span><span class="orange slashes" aria-hidden="true">//</span><span>WEAR IT EVERYWHERE.</span><span class="orange slashes" aria-hidden="true">//</span><span class="strip-outline">PADDOCK TO PAVEMENT.</span><span class="orange slashes" aria-hidden="true">//</span></div>
      <section id="collection" class="collection section-wrap" aria-labelledby="collection-title"><div class="section-heading"><div><div class="eyebrow orange">THE PADDOCKLOOM EDIT</div><h2 id="collection-title">Your next obsession.</h2></div><p>Race-day energy. Everyday expression.<br> A considered edit for those who get it.</p></div>
        <div class="brand-navigation"><span class="eyebrow orange">SHOP BY TEAM / BRAND</span><div id="brand-navigation">${brandButtons()}</div></div><div class="catalogue-toolbar"><div class="category-tabs" role="group" aria-label="Product categories">${['All',...productTypes(data)].map(c => `<button class="category-tab ${state.category === c ? 'selected' : ''}" data-category="${e(c)}" aria-pressed="${state.category === c}">${c === 'All' ? 'All pieces' : e(c)}</button>`).join('')}</div><div class="sort-control"><label for="sort">Sort by</label><select id="sort"><option value="featured">Featured</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option><option value="name">Name: A–Z</option></select>${icon('chevron')}</div></div>
        <div class="filter-row"><label class="catalogue-search">${icon('search')}<input id="catalogue-search" type="search" placeholder="Find your next favourite" aria-label="Search products" value="${e(state.query)}"></label><div class="collection-select"><label class="sr-only" for="collection-filter">Filter collection</label><select id="collection-filter"><option value="">All collections</option>${[...new Set(data.products.map(p=>p.collection))].map(c=>`<option>${e(c)}</option>`).join('')}</select>${icon('chevron')}</div><label class="stock-toggle"><input id="stock-filter" type="checkbox"><span class="custom-check">${icon('check')}</span> In stock</label><button class="text-button clear-filters" data-action="clear" hidden>Reset filters</button><span id="result-count" aria-live="polite"></span></div>
        <div id="saved-notice" class="saved-notice" hidden>Your saved pieces <button class="text-button" data-action="saved">Show all products</button></div><div id="product-grid" class="product-grid"></div>
        <div class="catalogue-footnote"><span>${icon('globe')} Curated in Singapore. Driven by motorsport.</span><span>All prices in SGD${data.previewMode ? ' · Preview collection' : ''}</span></div>
      </section>
      <section id="story" class="story section-wrap"><div class="story-visual"><img src="/images/hero.webp" alt="Sculptural carbon bodywork and rear wing in the pit garage" loading="lazy" width="1536" height="1024"><div class="story-image-caption"><span>THE CULTURE NEVER CLOCKS OUT.</span><span class="slashes">//</span></div></div><div class="story-copy"><div class="eyebrow orange">MORE THAN A RACE WEEKEND</div><h2>It's not just a sport.<br>It's part of you.</h2><p>The lights out. The late nights. The corner you can name without seeing the circuit. Some things stay with you long after the chequered flag.</p><p>PADDOCKLOOM is a Singapore-based independent motorsport store, built around that feeling. Caps, apparel and objects that bring a little of the paddock into your everyday.</p><a class="text-link" href="#collection">Find your piece of the culture <span class="orange" aria-hidden="true">//</span></a><div class="story-signature">SINGAPORE ROOTS. <span>RACING SOUL.</span></div></div></section>
      <section class="statement"><div class="eyebrow">FOR THE GRANDSTANDS. AND EVERYTHING AFTER.</div><p>THE RACE ENDS.<br><span>THE OBSESSION DOESN'T.</span></p><a href="#collection" class="button button-orange">Find your everyday race kit <span class="button-slashes" aria-hidden="true">//</span></a></section>
      <section id="how-it-works" class="ordering section-wrap"><div class="section-heading"><div><div class="eyebrow orange">A MORE PERSONAL PIT STOP</div><h2>Great pieces. Real conversations.</h2></div><p>No checkout queues here.<br> Find something you love. Let's talk.</p></div><div class="order-grid"><article><span class="order-icon">${icon('search')}</span><h3>Find your piece.</h3><p>Explore the edit, choose your colour and size, and save your favourites.</p></article><article><span class="order-icon">${icon('chat')}</span><h3>Make the connection.</h3><p>Enquire through WhatsApp, Carousell or email. Your product details come with you.</p></article><article><span class="order-icon">${icon('bag')}</span><h3>Make it yours.</h3><p>Confirm stock, delivery and payment arrangements directly with us before you order.</p></article></div><div class="contact-bar"><span>A question about a piece, a size or what's next?</span><button class="text-link" data-action="contact">Let's talk ${icon('chat')}</button></div></section>
      <section class="faq section-wrap"><div><div class="eyebrow orange">GOOD TO KNOW</div><h2>The finer details.</h2></div><div class="faq-list"><details><summary>How do I place an order? ${icon('plus')}</summary><p>Open a product, select a size and choose your preferred enquiry channel. We'll confirm availability, the final total and delivery arrangements directly. There is no online checkout.${data.previewMode ? ' This preview uses concept products; purchase channels are not connected yet.' : ''}</p></details><details><summary>Do you deliver in Singapore? ${icon('plus')}</summary><p>PADDOCKLOOM is based in Singapore. Delivery or collection arrangements, charges and timing will be confirmed with you before an order is accepted. Contact us about international enquiries.</p></details><details><summary>How do sizing and availability work? ${icon('plus')}</summary><p>Each product lists its available size options and stock status. Please confirm your chosen size and measurements with us before ordering. ${data.previewMode ? 'All current stock indicators and sizes are illustrative.' : 'Stock can change between catalogue updates.'}</p></details><details><summary>What about returns and exchanges? ${icon('plus')}</summary><p>Please ask us to confirm the applicable return and exchange terms before paying. If an item arrives with a problem, contact us with your order details and photos so we can help.</p></details><details><summary>Is PADDOCKLOOM affiliated with Formula 1? ${icon('plus')}</summary><p>PADDOCKLOOM is an independent store and is not affiliated with, endorsed by or sponsored by Formula 1 or any racing team. Brand and team names identify the designs shown.</p></details></div></section>
    </main>
    <footer class="footer section-wrap"><div class="footer-top"><div><a href="/" class="logo">${logo}</a><p>Motorsport culture.<br>Beyond the circuit.</p></div><div><span class="footer-label">EXPLORE</span><a href="#collection">The collection</a><a href="#story">Our world</a><a href="#how-it-works">How to order</a></div><div><span class="footer-label">GET IN TOUCH</span><button data-channel="whatsapp">WhatsApp</button>${data.contact.carousell?'<button data-channel="carousell">Carousell</button>':''}${data.contact.email?'<button data-channel="email">Email</button>':''}</div><div class="footer-note"><span class="footer-label">BASED IN SINGAPORE</span><span>For the love of the sport.<br>For the way you live it.</span><span class="footer-coordinate">1.3521° N / 103.8198° E</span></div></div><div class="footer-wordmark" aria-hidden="true">PADDOCKLOOM<span>.</span></div><div class="footer-bottom"><span>© ${new Date().getFullYear()} PADDOCKLOOM</span><span>INDEPENDENT BY DESIGN. DRIVEN BY OBSESSION.</span><div><button data-action="privacy">Privacy</button><button data-action="terms">Terms</button></div></div></footer>
    <dialog id="product-dialog" class="product-dialog" aria-labelledby="product-title"></dialog>
    <dialog id="search-dialog" class="small-dialog" aria-labelledby="search-title"><button class="dialog-close icon-button" data-close="search-dialog" aria-label="Close search">${icon('close')}</button><div class="eyebrow orange">THE COLLECTION</div><h2 id="search-title">Find your obsession.</h2><form id="search-form"><label class="search-field">${icon('search')}<input type="search" name="query" placeholder="Try caps, papaya or collectibles…" aria-label="Search catalogue" required></label><button class="button button-orange" type="submit">Search the collection</button></form><p class="muted">Caps · Apparel · Scale models</p></dialog>
    <dialog id="contact-dialog" class="small-dialog" aria-labelledby="contact-title"></dialog>
    <dialog id="info-dialog" class="small-dialog" aria-labelledby="info-title"></dialog>
    <dialog id="zoom-dialog" class="zoom-dialog" aria-label="Enlarged product image"><button class="dialog-close icon-button" data-close="zoom-dialog" aria-label="Close enlarged image">${icon('close')}</button><div id="zoom-photo"></div></dialog>`;
  renderProducts(); bindEvents();
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
      if(!updated){closeDialog('product-dialog');if(document.querySelector('#contact-dialog').open)closeDialog('contact-dialog');notify('This piece has been removed from the catalogue.');}
      else if(JSON.stringify(selectedVariant(updated,oldProduct.variantId))!==JSON.stringify(oldProduct)){
        if(document.querySelector('#contact-dialog').open)closeDialog('contact-dialog');
        openProduct(updated.id,false);
        const radio=[...document.querySelectorAll('input[name="size"]')].find(r=>r.value===oldSize);if(radio){radio.checked=true;activeSize=oldSize;}
        notify('Product information has been updated.');
      }
    }
    const banner=document.querySelector('.preview-strip');
    if(!data.previewMode)banner?.remove();
    else if(!banner){const b=document.createElement('div');b.className='preview-strip';b.textContent='THE PADDOCKLOOM PREVIEW · Concept products & illustrative prices.';document.querySelector('#app').prepend(b);}
  }catch{/* Keep the last successful catalogue during a temporary network interruption. */}
  finally{refreshBusy=false;}
}
function brandButtons(){return ['',...brands(data)].map(b=>`<button class="brand-tab ${state.brand===b?'selected':''}" data-brand="${e(b)}" aria-pressed="${state.brand===b}">${e(b||'All teams')}</button>`).join('');}
function renderProducts() {
  document.querySelector('#brand-navigation').innerHTML=brandButtons();
  document.querySelector('.category-tabs').innerHTML=['All',...productTypes(data)].map(c=>`<button class="category-tab" data-category="${e(c)}">${e(c==='All'?'All pieces':c)}</button>`).join('');
  const products = filterProducts(data.products, state).map(p=>({...p,status:variants(p).find(v=>['in-stock','low-stock'].includes(v.status))?.status||p.status}));
  document.querySelector('#result-count').textContent = `${products.length} ${products.length === 1 ? 'piece' : 'pieces'}`;
  document.querySelector('#saved-notice').hidden = !state.savedOnly;
  document.querySelector('.clear-filters').hidden = !(state.brand || state.query || state.category !== 'All' || state.collection || state.stock || state.savedOnly);
  document.querySelectorAll('[data-category]').forEach(b => { const selected = b.dataset.category === state.category; b.classList.toggle('selected', selected); b.setAttribute('aria-pressed', selected); });
  document.querySelectorAll('.saved-count').forEach(el => el.textContent = state.saved.length || '');
  document.querySelector('.saved-button').classList.toggle('is-saved', state.savedOnly);
  document.querySelector('#product-grid').innerHTML = products.length ? products.map((p,i)=>`<article class="product-card" style="--card-delay:${(i % 8) * 40}ms"><div class="product-image-wrap"><a class="product-image-link" href="?product=${e(p.id)}" data-product="${e(p.id)}" aria-label="View ${e(p.name)} in ${e(p.color)}">${productPhoto(p.images[0],`${p.name} in ${p.color}`)}<span class="quick-view">Discover the piece ${icon('plus')}</span></a><span class="product-badge">${e(p.badge || p.collection)}</span><button class="save-product ${state.saved.includes(p.id) ? 'is-saved' : ''}" data-save="${e(p.id)}" aria-label="${state.saved.includes(p.id) ? 'Unsave' : 'Save'} ${e(p.name)} in ${e(p.color)}" aria-pressed="${state.saved.includes(p.id)}">${icon('heart')}</button>${p.placeholder ? '<span class="concept-label">CONCEPT PREVIEW</span>' : ''}</div><div class="product-meta"><span>${e(p.category.toUpperCase())}</span><span class="stock-status ${e(p.status)}">${e(statuses[p.status])}</span></div><div class="product-title-row"><h3><a href="?product=${e(p.id)}" data-product="${e(p.id)}">${e(p.name)}</a></h3><span>${variants(p).some(v=>v.price!==minPrice(p))?'From ':''}${money(minPrice(p))} <small>SGD</small></span></div><div class="product-subtitle"><span>${e(p.brand||'Independent')} · ${variants(p).length} option${variants(p).length===1?'':'s'}</span><span class="color-swatch" style="--swatch:${e(p.colorHex)}" title="${e(p.color)}"></span></div></article>`).join('') : `<div class="empty-state">${icon(state.savedOnly ? 'heart' : 'search')}<h3>${state.savedOnly ? 'Your next favourites are waiting.' : 'No pieces on this grid.'}</h3><p>${state.savedOnly ? 'Save a piece with the heart icon to keep it here.' : 'Try another search or clear your filters to see the full edit.'}</p><button class="button button-light" data-action="clear">Explore all pieces</button></div>`;
}
function syncFilters() { const url = new URL(location); if(state.brand)url.searchParams.set('brand',state.brand);else url.searchParams.delete('brand'); if (state.category !== 'All') url.searchParams.set('category',state.category); else url.searchParams.delete('category'); if (state.query) url.searchParams.set('q',state.query); else url.searchParams.delete('q'); history.replaceState({},'',url); renderProducts(); }
function notify(message) { const t=document.querySelector('#toast'); t.textContent=message; t.showPopover?.(); t.classList.add('visible'); clearTimeout(toastTimeout); toastTimeout=setTimeout(()=>{t.classList.remove('visible');t.hidePopover?.();},3500); }
function showDialog(id) { const d=document.getElementById(id); if (!d.open) d.showModal(); document.body.classList.add('dialog-open'); }
function closeDialog(id) { document.getElementById(id).close(); if (!document.querySelector('dialog[open]')) document.body.classList.remove('dialog-open'); }
function closeProductUrl() { const url=new URL(location); url.searchParams.delete('product');url.searchParams.delete('colour'); history.replaceState({},'',url); activeProduct=null; document.title='PADDOCKLOOM — Driven by obsession.'; }
function openProduct(id, updateUrl=true, colourId) {
  const base=data.products.find(p=>p.id===id);const p=base?selectedVariant(base,colourId||new URLSearchParams(location.search).get('colour')):null; if (!p) { notify('This piece is no longer in the catalogue.'); closeProductUrl(); return; }
  const previousSize=activeSize;activeProduct=p; activeSize=p.sizes.includes(previousSize)?previousSize:p.sizes[0];
  const colourUrl=new URL(location);colourUrl.searchParams.set('colour',p.variantId);history.replaceState({},'',colourUrl);
  if (updateUrl) { const url=new URL(location); url.searchParams.set('product',id); history.pushState({},'',url); }
  document.title=`${p.name} — ${p.color} | PADDOCKLOOM`;
  document.querySelector('#product-dialog').innerHTML=`<button class="dialog-close icon-button" data-close="product-dialog" aria-label="Close product">${icon('close')}</button><div class="product-detail-grid"><div class="detail-gallery"><button class="image-zoom" data-action="zoom" aria-label="Enlarge product image">${productPhoto(p.images[0],`${p.name} — ${p.color}`,'id="detail-image"')}${icon('expand')}</button>${p.images.length>1 ? `<div class="thumbnails">${p.images.map((src,i)=>`<button data-image="${e(src)}" aria-label="View product photo ${i+1}">${productPhoto(src,`Product photo ${i+1}`)}</button>`).join('')}</div>` : ''}<span class="detail-image-note">${p.placeholder ? 'ILLUSTRATIVE CONCEPT · NOT FINAL PRODUCT PHOTOGRAPHY' : e(p.collection.toUpperCase())}</span></div><div class="detail-content"><div class="eyebrow orange">${e(p.collection)} / ${e(p.category)}</div><h2 id="product-title">${e(p.name)}</h2><p class="detail-subtitle">${e(p.color)}</p><div class="detail-price">${money(p.price)} <span>SGD</span><span class="stock-status ${e(p.status)}">${e(statuses[p.status])}</span></div><p>${e(p.description)}</p>${p.placeholder ? '<div class="preview-note">Concept preview. Design, price, sizes and stock are illustrative and will be confirmed with actual inventory.</div>' : ''}<fieldset class="colour-options"><legend>Choose colour / design</legend>${variants(base).map(v=>`<button class="colour-choice ${v.id===p.variantId?'selected':''}" data-variant="${e(v.id)}" aria-pressed="${v.id===p.variantId}"><span style="background:${e(v.colorHex)}"></span>${e(v.color)}<small>${e(statuses[v.status])}</small></button>`).join('')}</fieldset><fieldset class="size-options"><legend>${p.category === 'Scale models' ? 'Scale' : 'Select size'}</legend>${p.sizes.map((s,i)=>`<label><input type="radio" name="size" value="${e(s)}" ${s===activeSize?'checked':''}><span>${e(s)}</span></label>`).join('')}</fieldset>${sizeGuide(p.category)}<div class="enquiry-actions"><button class="button button-orange" data-channel="whatsapp">${icon('chat')} ${['sold-out','coming-soon'].includes(p.status) ? 'Ask about availability' : 'Enquire on WhatsApp'}</button><div>${purchaseUrl('carousell',data.contact,p,activeSize)?'<button class="button button-outline" data-channel="carousell">View on Carousell</button>':''}${data.contact.email?`<button class="button button-outline" data-channel="email">${icon('mail')} Email us</button>`:''}</div></div><p class="enquiry-note">A conversation, then a confirmation.<br>Stock, delivery and payment arranged directly.</p><details open><summary>Details & finish ${icon('plus')}</summary><ul>${p.details.map(d=>`<li>${e(d)}</li>`).join('')}</ul></details><details><summary>Delivery & ordering ${icon('plus')}</summary><p>Enquire to confirm stock, sizing and delivery or collection options. Final costs and arrangements are agreed directly before payment. Prices are in Singapore dollars.</p></details><button class="text-button share-product" data-action="share">${icon('copy')} Copy link to this piece</button></div></div>`;
  showDialog('product-dialog');
}
function contact(channel) {
  const product = document.querySelector('#product-dialog').open ? activeProduct : null;
  const url=channel ? purchaseUrl(channel,data.contact,product,activeSize) : '';
  if (url && !data.previewMode) { if(channel==='email') location.href=url; else window.open(url,'_blank','noopener,noreferrer'); return; }
  const message=enquiryMessage(product,activeSize);
  document.querySelector('#contact-dialog').innerHTML=`<button class="dialog-close icon-button" data-close="contact-dialog" aria-label="Close enquiry">${icon('close')}</button><div class="eyebrow orange">LET'S TALK MOTORSPORT</div><h2 id="contact-title">Your next piece<br>starts here.</h2>${data.previewMode || (channel && !url) ? (data.previewMode ? '<p>This catalogue is in preview mode. You can preview and copy an enquiry below.</p>' : '<p>This purchase channel is not connected yet. Copy your enquiry or use an available channel below.</p>') : '<p>Choose a channel to confirm availability and arrange your order directly with PADDOCKLOOM.</p>'}<label class="enquiry-label" for="enquiry-message">Your enquiry</label><textarea id="enquiry-message" rows="5">${e(message)}</textarea><button class="button button-light" data-action="copy-enquiry">${icon('copy')} Copy enquiry</button><div class="contact-channels">${['whatsapp','carousell','email'].map(c=>`<button class="button button-outline" data-channel="${c}" ${data.previewMode || !purchaseUrl(c,data.contact,product,activeSize) ? 'disabled' : ''}>${c==='whatsapp'?'WhatsApp':c==='carousell'?'Carousell':'Email'}</button>`).join('')}</div>${data.previewMode ? '<p class="small muted">Preview only · No message has been sent.</p>' : ''}`;
  showDialog('contact-dialog');
}
async function copy(text, success) { try { await navigator.clipboard.writeText(text); notify(success); } catch { notify('Copy is unavailable. Select and copy the text or address manually.'); } }
function showInfo(type) {
  const privacy=type==='privacy';
  document.querySelector('#info-dialog').innerHTML=`<button class="dialog-close icon-button" data-close="info-dialog" aria-label="Close information">${icon('close')}</button><div class="eyebrow orange">PADDOCKLOOM</div><h2 id="info-title">${privacy?'Your privacy.':'A few ground rules.'}</h2>${privacy?'<p>This catalogue has no accounts, payment collection, advertising cookies or analytics. Saved products are stored only in this browser using local storage.</p><p>Choosing a purchase channel takes you to WhatsApp, Carousell or your email app. Any information you share there is handled by that service and the business receiving your enquiry.</p><p>You can clear your saved pieces below. The admin dashboard uses a secure session cookie to keep its owner signed in. Customer favourites stay on this device.</p><button class="button button-outline" data-action="clear-saved">Clear saved products</button>':'<p>PADDOCKLOOM is a product catalogue. An enquiry is not an order confirmation. Availability, product details, delivery charges, return terms and payment arrangements must be confirmed directly before purchasing.</p><p>Prices are shown in SGD. Product photos show the available designs. Confirm your selected colour, driver number, size and availability before placing an order.</p><p>PADDOCKLOOM is independent and is not affiliated with Formula 1 or any racing team. Brand names belong to their respective owners.</p>'}`; showDialog('info-dialog');
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

