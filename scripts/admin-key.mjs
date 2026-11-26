import { randomBytes, createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
await mkdir('.local',{recursive:true});
let secrets;
try { secrets=JSON.parse(await readFile('.local/admin-secrets.json','utf8')); }
catch(error){if(error.code!=='ENOENT')throw error;const key=randomBytes(32).toString('base64url');secrets={key,ADMIN_KEY_HASH:createHash('sha256').update(key).digest('hex'),SESSION_SECRET:randomBytes(32).toString('hex')};await writeFile('.local/admin-secrets.json',JSON.stringify(secrets));}
await writeFile('.local/admin-access.txt',`PADDOCKLOOM PRIVATE ADMIN ACCESS\n\nSign in at your website's /admin address using this access key:\n\n${secrets.key}\n\nKeep this file private. Save the key in your password manager. It is excluded from GitHub.\n`);
await writeFile('.dev.vars',`ADMIN_KEY_HASH=${secrets.ADMIN_KEY_HASH}\nSESSION_SECRET=${secrets.SESSION_SECRET}\n`);
if(process.argv.includes('--upload')){
  for(const name of ['ADMIN_KEY_HASH','SESSION_SECRET']){
    const result=spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','secret','put',name],{input:secrets[name]+'\n',encoding:'utf8',windowsHide:true});
    if(result.status!==0){console.error(`Failed to configure ${name}.`);process.exit(1);}
    console.log(`Configured ${name}.`);
  }
}
console.log('Private admin access saved to .local/admin-access.txt; the access key was not printed.');
