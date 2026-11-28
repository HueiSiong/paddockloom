# PADDOCKLOOM

## Shop refresh and order offers

All 285 imported product photos have been reviewed and cleaned of supplier captions and stray labels around the products. Cleaned WebP assets are in `public/images/clean/`; their repeatable crop/margin instructions are in `scripts/photo-cleanup.mjs`. Product designs are preserved. Older static assets remain available for previous catalogue backups. Dashboard photo storage usage is unchanged.

The storefront uses shop descriptions, a CSS separator on listing labels, and `paddockloom@gmail.com` for enquiries. An order bag keeps selected colours, sizes and quantities in the customer's browser. Two or more items receive free shipping; three or more also receive 10% off the merchandise subtotal, rounded to cents. Totals are calculated from the current catalogue. Buyers send the order on WhatsApp or email to confirm availability, delivery and payment; no payment checkout is added.

Offer logic: `src/order.js`. Order interface: `src/order-ui.js`. Store content: `src/store-content.js`. Verify with `npm test`, `npm run build` and `node tests/shop-browser.mjs` (read-only against the live catalogue when `TEST_URL` is set).

## November 2026 inventory import

The catalogue now contains 83 product listings and 253 colour/design options across 10 teams. Buyers filter by team, Caps/Shirts and Standard collection/Special livery. A driver number is part of the selectable option name and WhatsApp enquiry. Multiple views of one item are grouped in its gallery; a composite front/back photo represents one item, not a bundle. Supplied screenshot interfaces and prices have been permanently cropped away with the owner's approval; product photography is compressed to WebP without redrawing logos or details.

Pricing: standard caps SGD 24.90, special-livery caps SGD 35.90, standard shirts SGD 39.90, special-livery shirts SGD 59.90. Special-livery classifications use the pictured graphic/alternate designs, without claiming unverified race editions. The owner can refine these classifications and prices in Inventory Studio.

Shirts use S–4XL and the readable Mercedes reference chart. The customer size guide displays the measurements and offers help choosing a size. The second supplied chart has cropped size labels, so it was not used to infer size names. No material, licensing or exact stock quantity claims have been added.

WhatsApp is connected. Carousell and email buttons appear only when a channel is configured. The original concept inventory is backed up locally and replaced by actual supplied inventory.

Inventory Studio now includes listing search and a direct Teams & product types link. Online edits remain in D1 and survive code deployments. Imported photo assets are served statically, so they do not consume the 100 MB dashboard upload allowance. Future dashboard uploads still use that capped allowance; no paid storage has been enabled.

Import source mapping: `scripts/inventory-manifest.mjs`. Private source screenshots, backups and the detailed review CSV remain in the ignored `Images/` and `.local/inventory-import/` folders. Do not rerun the preparation or publishing scripts against later owner edits without reconciling them first; the publisher refuses to overwrite a catalogue that changed after its backup.

Validation: `npm test`, `npm run build`, and `node tests/inventory-browser.mjs`. Set `TEST_URL` to the published site to run the read-only browser checks there. The older destructive hosted/variant test scripts are development fixtures and should not be run against production inventory.

Singapore motorsport catalogue: cinematic imagery, SGD prices, filters, favourites and a private online inventory studio. No checkout or payment processor.

- Website: https://paddockloom.paddockloom.workers.dev
- Admin: https://paddockloom.paddockloom.workers.dev/admin
- Source: https://github.com/HueiSiong/paddockloom

## Manage products online

### Teams, product types and colour variants

In the dashboard, scroll to **Teams & product types** to add or edit names (one per line), then assign a team/brand and category to each product. Reassign products before removing a name that is in use. Mercedes, McLaren, Red Bull and Independent are initial choices; these labels do not imply that existing concept products are official team merchandise.

Use **Add colour** on a product to create a variant. Select a colour under **Editing colour**, then edit its photos, price, stock, sizes and optional Carousell listing. A new colour initially copies the selected colour's details and photos as a starting point; replace them before saving. At least one colour must remain. Each colour needs a photo. Prices and stock are per colour, while title, description, team and category apply to the product as a whole.

Customers can choose a team, then a product type. Product pages have colour buttons that update photos, price, stock and sizes together; enquiries include the selected colour and price. Existing listings are preserved and become single-colour products when opened in the new editor. Separate existing listings are not merged automatically.

1. Open `/admin` on the published website.
2. Sign in with your private admin access key. On the owner's original computer it is in `.local/admin-access.txt`, which is excluded from GitHub. Save the key in your password manager.
3. Add/edit/remove products; change prices, sizes, categories, stock and photos.
4. Click **Save catalogue**. Changes are stored online and appear in open customer pages within about 15 seconds. New visitors load the current catalogue immediately.

Your computer can be off. Inventory edits do not need VS Code or deployment. Design/code changes still require deployment.

The live collection contains the imported product photos and agreed prices, with WhatsApp connected and preview mode off. New products start with a concept checkbox: clear it after entering actual information and photos. Purchase channels remain editable in **Store & contact settings**. No enquiry is sent automatically.

## Free trial architecture

- Cloudflare **Workers Free** hosts the website and API on a free `workers.dev` address.
- Cloudflare **D1 Free** stores catalogue data, ten previous revisions and compressed uploaded photos.
- No R2 subscription, paid authentication service, paid image service or custom domain is required.
- Workers Free currently allows **100,000 dynamic requests/day**. Static assets do not consume this allowance; catalogue polling and uploaded image requests do. Exceeding quotas can interrupt service. This project does not activate a paid plan.
- Application limits: **500 products, 100 MB total uploaded photo storage, 750 KB per compressed photo**. Original uploads can be up to 8 MB / 40 megapixels. The browser compresses/resizes them into WebP with a maximum long edge of 1400px.
- Small photo blobs fit D1's 2 MB row limit. This bounded arrangement suits a trial catalogue. A larger photo-heavy business should migrate media to dedicated object storage.
- Removing a product/photo from the catalogue does not delete stored image bytes, preserving earlier versions. If storage fills, back up and clean up unreferenced images; uploads stop instead of enabling paid storage.
- Live refresh pauses in hidden tabs, checks again when visible, and retains the last successful catalogue during temporary network failures.

Provider limits may change: [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) and [D1 limits](https://developers.cloudflare.com/d1/platform/limits/).

## Security and backups

The admin key contains 32 random bytes. Cloudflare stores its SHA-256 hash and a separate signing secret. Sessions last 12 hours and use signed HttpOnly, Secure, SameSite cookies over HTTPS. Writes check authentication and request origin; failed logins are limited per IP. Revision checks prevent an older tab from silently overwriting another tab's save.

The login page is public; its data and mutation endpoints are protected. `.local/`, `.dev.vars`, environment files and runtime credentials are excluded from GitHub. The initial published trial remains `noindex` until real inventory and launch content are ready.

Online edits live in D1, **not GitHub or your local JSON**. `public/catalogue.json` is demo seed/local-development data. Redeploying code does not replace the online catalogue. Online saves retain ten previous catalogue revisions; D1 Free currently offers seven-day point-in-time recovery.

**Download catalogue backup** exports metadata and image paths, not photo binaries. For a complete private backup, export the database including its media table:

```powershell
npx.cmd wrangler d1 export paddockloom-catalogue --remote --output .local/full-backup.sql
```

Keep backups independently of this computer. The local file editor retains `.catalogue.backup.json` as a one-version backup.

## Local development

Use Node.js 24 or newer:

```powershell
npm.cmd ci
npm.cmd run dev
```

Website: http://127.0.0.1:5173/ · Local file editor: http://127.0.0.1:5173/studio.html

The local editor changes local files only. Use the published `/admin` address to edit the live site.

To test the hosted architecture with a separate local database:

```powershell
node scripts/admin-key.mjs
npm.cmd run build
npm.cmd run db:local
npm.cmd run dev:cloud
```

Cloud-runtime preview: http://127.0.0.1:8787/admin

## Verification

```powershell
npm.cmd test
npm.cmd run build
# Vite server must be running:
npm.cmd run test:browser
# Local Cloudflare runtime must be running:
npm.cmd run test:hosted
```

Browser checks use installed Chrome. Hosted checks cover login, protected writes, uploads, pricing, automatic refresh in another customer browser, add/remove listings, concurrent-save protection, request-origin checks and logout. They restore original catalogue data. Test photo blobs remain in the test database. Tests use local data unless `TEST_URL` explicitly selects production.

GitHub Actions runs build/catalogue checks and a Worker dry run. It does not automatically deploy or hold deployment credentials.

## Deployment and recovery

After Cloudflare browser OAuth login, an authorised maintainer can deploy code with `npm.cmd run deploy`. Routine product edits need no deployment.

For a fresh account: create a D1 database, update its ID in `wrangler.jsonc`, apply `worker/migrations`, run `node scripts/seed-db.mjs`, import `.local/seed.sql`, run `node scripts/admin-key.mjs --upload`, then deploy. The seed uses `INSERT OR IGNORE` to preserve existing inventory.

The admin-key helper reuses existing secrets. To rotate a compromised/lost key, an authorised maintainer should replace the private local secret file and upload newly generated secrets. Rotating the session-signing secret invalidates old sessions. Never commit private keys.

## Source map

| File | Purpose |
| --- | --- |
| `src/main.js`, `src/style.css` | Storefront and live refresh |
| `src/studio.js`, `src/studio.css` | Login and inventory editor |
| `src/photo.js` | Photo compression on the owner's device |
| `src/catalogue.js` | Validation, filters, pricing and enquiry links |
| `worker/index.js`, `worker/migrations/` | Online API, authentication and D1 schema |
| `wrangler.jsonc` | Cloudflare deployment configuration |
| `vite.config.js` | Frontend build and local-only file editor API |
| `public/images/` | Original illustrative WebP assets |
| `scripts/asset-sources.json` | Exact image-generation prompts |

Original campaign and concept product assets were created with the built-in image generation tool. They are not official Formula 1 or racing-team merchandise. Original machine-specific asset paths stay in `.local/asset-sources.json`; the website only needs the included WebP files.
