import { defineConfig } from 'vite';
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { validateCatalogue } from './src/catalogue.js';

const root = import.meta.dirname;
function studioApi() {
  return {
    name: 'paddockloom-local-studio',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/__studio/')) return next();
        const json = (code, body) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(body)); };
        const address = req.socket.remoteAddress;
        if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(address)) return json(403, { error: 'The inventory studio is available on this computer only.' });
        const hostname = new URL(`http://${req.headers.host}`).hostname;
        if (!['127.0.0.1', 'localhost', '[::1]'].includes(hostname)) return json(403, { error: 'Use a localhost address to access the inventory studio.' });
        if (req.method !== 'GET' && req.headers.origin !== `http://${req.headers.host}`) return json(403, { error: 'A same-origin request is required.' });
        try {
          if (req.method === 'GET' && req.url === '/__studio/catalogue') return json(200, JSON.parse(await readFile(resolve(root, 'public/catalogue.json'), 'utf8')));
          if (req.method !== 'POST') return json(405, { error: 'Method not allowed.' });
          const chunks = []; let bytes = 0;
          for await (const chunk of req) { bytes += chunk.length; if (bytes > 12 * 1024 * 1024) return json(413, { error: 'Use an image smaller than 8 MB.' }); chunks.push(chunk); }
          const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          if (req.url === '/__studio/catalogue') {
            const errors = validateCatalogue(body);
            if (errors.length) return json(400, { error: errors.join('\n') });
            const file = resolve(root, 'public/catalogue.json');
            await writeFile(resolve(root, '.catalogue.backup.json'), await readFile(file));
            const temp = resolve(root, `.catalogue-${randomUUID()}.tmp`);
            await writeFile(temp, JSON.stringify(body, null, 2) + '\n');
            await rename(temp, file);
            return json(200, { saved: true });
          }
          if (req.url === '/__studio/image') {
            if (typeof body.base64 !== 'string') return json(400, { error: 'An image is required.' });
            const buffer = Buffer.from(body.base64, 'base64');
            if (buffer.length > 8 * 1024 * 1024) return json(413, { error: 'Use an image smaller than 8 MB.' });
            const pipeline = sharp(buffer, { limitInputPixels: 40000000 });
            const metadata = await pipeline.metadata();
            if (!['jpeg','png','webp','avif'].includes(metadata.format)) return json(400, { error: 'Choose a JPEG, PNG, WebP or AVIF image.' });
            const name = `product-${randomUUID()}.webp`;
            await mkdir(resolve(root, 'public/images'), { recursive: true });
            await pipeline.rotate().resize(1800,1800,{fit:'inside',withoutEnlargement:true}).webp({quality:86}).toFile(resolve(root,'public/images',name));
            return json(200,{path:`/images/${name}`});
          }
          return json(404,{error:'Unknown studio action.'});
        } catch (error) { console.error('Studio:', error.message); return json(400, { error: 'Unable to process this request. Check the content or image format and try again.' }); }
      });
    }
  };
}
export default defineConfig({ plugins: [studioApi()], server: { host: '127.0.0.1', port: 5173, strictPort: true }, preview: { host:'127.0.0.1' }, build: { target: 'es2022', rollupOptions: { input: { main: resolve(root,'index.html'), studio: resolve(root,'studio.html') } } } });
