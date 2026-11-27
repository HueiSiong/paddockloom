import {escapeHtml as e} from './catalogue.js';

// Square catalogue viewport preserves each photo's full aspect ratio.
export function productPhoto(src,alt,attributes=''){
 return `<span class="product-photo"><img src="${e(src)}" alt="${e(alt)}" width="800" height="800" loading="lazy" ${attributes}></span>`;
}
