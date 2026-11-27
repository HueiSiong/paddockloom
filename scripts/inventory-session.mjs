import fs from 'node:fs/promises';
export const base=process.env.TEST_URL||'https://paddockloom.paddockloom.workers.dev';
export async function session(){
 const {key}=JSON.parse(await fs.readFile('.local/admin-secrets.json','utf8'));
 const response=await fetch(base+'/__studio/login',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({key})});
 if(!response.ok)throw new Error(`Admin login failed (${response.status})`);
 const cookie=response.headers.get('set-cookie').split(';')[0];
 return async function request(route,options={}){const r=await fetch(base+route,{...options,headers:{Cookie:cookie,Origin:base,...options.headers}});if(!r.ok)throw new Error(`${route}: ${r.status}: ${await r.text()}`);return r;};
}
if(process.argv.includes('--snapshot')){
 const request=await session(),r=await request('/__studio/catalogue'),data=await r.json();
 const storage=await (await request('/__studio/storage')).json();
 await fs.mkdir('.local/inventory-import',{recursive:true});
 await fs.writeFile('.local/inventory-import/before.json',JSON.stringify(data,null,2),{flag:'wx'});
 await fs.writeFile('.local/inventory-import/revision.json',JSON.stringify({revision:r.headers.get('x-catalogue-revision'),storage}));
 console.log(JSON.stringify({products:data.products.map(p=>({id:p.id,name:p.name,placeholder:p.placeholder})),brands:data.brands,productTypes:data.productTypes,previewMode:data.previewMode,connectedChannels:Object.keys(data.contact).filter(k=>!!data.contact[k]),storage},null,2));
}
