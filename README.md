# PADDOCKLOOM

Singapore motorsport catalogue: cinematic imagery, SGD prices, filters, favourites and a private online inventory studio. No checkout or payment processor.

- Website: https://paddockloom.paddockloom.workers.dev
- Admin: https://paddockloom.paddockloom.workers.dev/admin
- Source: https://github.com/HueiSiong/paddockloom

## Manage products online

1. Open `/admin` on the published website.
2. Sign in with your private admin access key. On the owner's original computer it is in `.local/admin-access.txt`, which is excluded from GitHub. Save the key in your password manager.
3. Add/edit/remove products; change prices, sizes, categories, stock and photos.
4. Click **Save catalogue**. Changes are stored online and appear in open customer pages within about 15 seconds. New visitors load the current catalogue immediately.

Your computer can be off. Inventory edits do not need VS Code or deployment. Design/code changes still require deployment.

The initial collection contains clearly labelled concept products. Add your real purchase channels in **Store & contact settings** and turn off **Preview mode** when ready. Clear each product's concept checkbox only after replacing illustrative information and photos with actual inventory. No enquiry is sent automatically.

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
