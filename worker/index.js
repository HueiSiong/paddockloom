import { validateCatalogue } from '../src/catalogue.js';
import seed from '../public/catalogue.json' with { type: 'json' };

const encoder = new TextEncoder();
const noStore = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const json = (body, status=200, headers={}) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type':'application/json; charset=utf-8', ...noStore, ...headers } });
const hash = async text => [...new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(text)))].map(x=>x.toString(16).padStart(2,'0')).join('');
const secure = request => new URL(request.url).protocol==='https:';
function cookie(request, value, maxAge=43200) { return `${secure(request)?'__Host-':''}paddockloom_admin=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secure(request)?'; Secure':''}`; }
async function hmacKey(secret) { return crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']); }
async function session(env) { const expires=Date.now()+43200000; const payload=`${expires}.${crypto.randomUUID()}`; const sig=await crypto.subtle.sign('HMAC',await hmacKey(env.SESSION_SECRET),encoder.encode(payload)); return `${payload}.${btoa(String.fromCharCode(...new Uint8Array(sig)))}`; }
export async function authenticated(request,env) {
  if(!env.ADMIN_KEY_HASH||!env.SESSION_SECRET)return false;
  const name=secure(request)?'__Host-paddockloom_admin':'paddockloom_admin';
  const value=request.headers.get('Cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(name+'='))?.slice(name.length+1);
  if(!value)return false;
  const [expires,nonce,signature,...extra]=value.split('.');
  if(extra.length||!nonce||!signature||!Number.isFinite(Number(expires))||Number(expires)<Date.now()||Number(expires)>Date.now()+43200000)return false;
  try{return await crypto.subtle.verify('HMAC',await hmacKey(env.SESSION_SECRET),Uint8Array.from(atob(signature),c=>c.charCodeAt(0)),encoder.encode(`${expires}.${nonce}`));}catch{return false;}
}
async function readJson(request,maxBytes) {
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))throw new Error('JSON_REQUIRED');
  if(Number(request.headers.get('Content-Length'))>maxBytes)throw new Error('TOO_LARGE');
  const reader=request.body?.getReader();if(!reader)throw new Error('JSON_REQUIRED');
  const chunks=[];let length=0;
  while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>maxBytes){await reader.cancel();throw new Error('TOO_LARGE');}chunks.push(value);}
  const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  return JSON.parse(new TextDecoder().decode(bytes));
}
async function catalogue(db) { return await db.prepare('SELECT body, revision FROM catalogue WHERE id=1').first() || {body:JSON.stringify(seed),revision:0}; }
function sameOrigin(request){return request.headers.get('Origin')===new URL(request.url).origin;}
export async function handle(request,env) {
  const url=new URL(request.url), path=url.pathname, method=request.method;
  if(url.protocol==='http:'&&!['localhost','127.0.0.1','[::1]'].includes(url.hostname)){
    url.protocol='https:';return Response.redirect(url,308);
  }
  if(path==='/admin'||path==='/admin/')return env.ASSETS.fetch(new Request(new URL('/studio.html',url),request));
  if(path==='/catalogue.json'){
    if(!['GET','HEAD'].includes(method))return json({error:'Method not allowed.'},405);
    const record=await catalogue(env.DB);const etag=`"catalogue-${record.revision}"`;
    if(request.headers.get('If-None-Match')===etag)return new Response(null,{status:304,headers:{...noStore,ETag:etag}});
    return new Response(method==='HEAD'?null:record.body,{headers:{...noStore,'Content-Type':'application/json',ETag:etag}});
  }
  if(path.startsWith('/images/upload-')){
    if(!['GET','HEAD'].includes(method))return json({error:'Method not allowed.'},405);
    const id=path.slice('/images/'.length);
    if(!/^upload-[a-f0-9-]{36}\.webp$/.test(id))return new Response('Not found',{status:404});
    const row=await env.DB.prepare('SELECT body FROM media WHERE id=?').bind(id).first();
    if(!row)return new Response('Not found',{status:404});
    const body=row.body instanceof ArrayBuffer?row.body:new Uint8Array(row.body);
    return new Response(method==='HEAD'?null:body,{headers:{'Content-Type':'image/webp','Cache-Control':'public,max-age=31536000,immutable','X-Content-Type-Options':'nosniff'}});
  }
  if(!path.startsWith('/__studio/'))return env.ASSETS.fetch(request);
  if(!env.ADMIN_KEY_HASH||!env.SESSION_SECRET)return json({error:'The admin dashboard is not configured yet.'},503);
  if(!['GET','POST'].includes(method))return json({error:'Method not allowed.'},405);
  if(method==='POST'&&!sameOrigin(request))return json({error:'This request must come from your website.'},403);
  if(path==='/__studio/login'&&method==='POST'){
    const {key}=await readJson(request,2048);
    const ip=await hash(request.headers.get('CF-Connecting-IP')||'local');const now=Date.now();
    const attempt=await env.DB.prepare('SELECT attempts, expires FROM login_attempts WHERE id=?').bind(ip).first();
    if(attempt&&attempt.expires>now&&attempt.attempts>=10)return json({error:'Too many attempts. Try again in 15 minutes.'},429);
    if(typeof key!=='string'||key.length<40||await hash(key)!==env.ADMIN_KEY_HASH){
      await env.DB.batch([
        env.DB.prepare('DELETE FROM login_attempts WHERE expires<?').bind(now),
        env.DB.prepare('INSERT INTO login_attempts(id,attempts,expires) VALUES(?,1,?) ON CONFLICT(id) DO UPDATE SET attempts=attempts+1').bind(ip,now+900000)
      ]);
      return json({error:'That admin access key is not correct.'},401);
    }
    await env.DB.prepare('DELETE FROM login_attempts WHERE id=?').bind(ip).run();
    return json({ok:true},200,{'Set-Cookie':cookie(request,await session(env))});
  }
  if(!await authenticated(request,env))return json({error:'Sign in to manage your catalogue.'},401);
  if(path==='/__studio/logout'&&method==='POST')return json({ok:true},200,{'Set-Cookie':cookie(request,'',0)});
  if(path==='/__studio/catalogue'&&method==='GET'){
    const record=await catalogue(env.DB);
    return json(JSON.parse(record.body),200,{'X-Catalogue-Revision':String(record.revision),'X-Studio-Mode':'cloud'});
  }
  if(path==='/__studio/catalogue'&&method==='POST'){
    const data=await readJson(request,500000);const errors=validateCatalogue(data);
    if(data?.products?.length>500)errors.push('The free trial supports up to 500 products.');
    if(errors.length)return json({error:errors.join('\n')},400);
    const expected=Number(request.headers.get('If-Match'));
    if(!request.headers.has('If-Match')||!Number.isInteger(expected)||expected<0)return json({error:'Refresh the dashboard before saving.'},428);
    const body=JSON.stringify(data);
    const result=expected===0
      ?await env.DB.prepare('INSERT OR IGNORE INTO catalogue(id,body,revision) VALUES(1,?,1)').bind(body).run()
      :await env.DB.prepare('UPDATE catalogue SET body=?, revision=revision+1, updated_at=CURRENT_TIMESTAMP WHERE id=1 AND revision=?').bind(body,expected).run();
    if(result.meta.changes===0)return json({error:'This catalogue changed in another tab. Download your edits as a backup, then refresh before saving.'},409);
    return json({saved:true,revision:expected+1});
  }
  if(path==='/__studio/image'&&method==='POST'){
    const body=await readJson(request,1100000);
    if(typeof body.base64!=='string')return json({error:'Choose a product photo.'},400);
    let bytes;try{bytes=Uint8Array.from(atob(body.base64),c=>c.charCodeAt(0));}catch{return json({error:'Invalid image.'},400);}
    if(bytes.length>750000)return json({error:'The optimised photo must be smaller than 750 KB.'},413);
    if(bytes.length<16||new TextDecoder().decode(bytes.slice(0,4))!=='RIFF'||new TextDecoder().decode(bytes.slice(8,12))!=='WEBP')return json({error:'Upload an optimised WebP image.'},400);
    const id=`upload-${crypto.randomUUID()}.webp`;
    await env.DB.prepare('INSERT INTO media(id,body) VALUES(?,?)').bind(id,bytes.buffer).run();
    return json({path:`/images/${id}`});
  }
  if(path==='/__studio/storage'&&method==='GET'){
    const stats=await env.DB.prepare('SELECT count(*) AS photos, COALESCE(sum(length(body)),0) AS bytes FROM media').first();
    return json({...stats,limit:100000000});
  }
  return json({error:'Not found.'},404);
}
export default { async fetch(request,env) {
  try{
    const response=await handle(request,env);const headers=new Headers(response.headers);
    headers.set('X-Content-Type-Options','nosniff');headers.set('Referrer-Policy','strict-origin-when-cross-origin');headers.set('X-Frame-Options','DENY');
    headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');
    if(new URL(request.url).pathname.startsWith('/admin')||new URL(request.url).pathname.includes('studio'))headers.set('Cache-Control','no-store');
    return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
  }catch(error){
    if(error.message==='TOO_LARGE')return json({error:'This upload is too large.'},413);
    if(error.message==='JSON_REQUIRED'||error instanceof SyntaxError)return json({error:'Invalid request.'},400);
    if(error.message.includes('PHOTO_STORAGE_FULL'))return json({error:'Your 100 MB free-trial photo allowance is full. No paid storage has been enabled.'},409);
    console.error('Request failed:',error.message);
    return json({error:'The service is temporarily unavailable. Please try again shortly. Your changes have not been confirmed.'},503);
  }
}};
