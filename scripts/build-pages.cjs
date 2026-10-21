// Run at Netlify build time: node scripts/build-pages.cjs
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const shared=path.join(root,'shared');
const pages=[];
function walk(dir,parts=[]){
  if(!fs.existsSync(dir))return;
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(entry.name.startsWith('.'))continue;
    const next=[...parts,entry.name];
    if(entry.isDirectory())walk(path.join(dir,entry.name),next);
    else if(entry.isFile() && /\.html?$/i.test(entry.name)){
      const url='/shared/'+next.map(encodeURIComponent).join('/');
      const title=entry.name.replace(/\.html?$/i,'').replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim();
      pages.push({title,url});
    }
  }
}
walk(shared);
pages.sort((a,b)=>a.title.localeCompare(b.title,undefined,{numeric:true}));
fs.writeFileSync(path.join(root,'pages.json'),JSON.stringify({pages},null,2)+'\n');
console.log('Generated pages.json with '+pages.length+' shared HTML pages');
