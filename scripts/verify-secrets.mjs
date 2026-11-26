// Check the prospective public source without printing secret values.
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const files=execFileSync('git',['ls-files','--cached'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
const secrets=JSON.parse(await readFile('.local/admin-secrets.json','utf8'));
for(const file of files){
  if(/(^|\/)(\.local|\.wrangler|node_modules|\.npm-cache)(\/|$)|(^|\/)\.dev\.vars|\.env/.test(file))throw new Error(`Private file staged: ${file}`);
  const content=await readFile(file);
  for(const secret of Object.values(secrets))if(content.includes(Buffer.from(secret)))throw new Error(`Secret found in ${file}`);
}
console.log(`Checked ${files.length} staged files: no admin secrets or private runtime folders.`);
