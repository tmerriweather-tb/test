(function(){
 const select=document.getElementById('shared-page-nav-select');if(!select)return;
 fetch('/pages.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('No directory');return r.json()}).then(data=>{
  const pages=Array.isArray(data)?data:(data.pages||[]);
  const current=decodeURIComponent(location.pathname);
  const p=pages.find(x=>decodeURIComponent(x.url||'')===current);
  const name=current.split('/').pop().split('_')[0].toLowerCase().replace(/[^a-z0-9]/g,'');
  const group=p?.group||(['ahold','giant','giantfoods','martins','stopshop'].includes(name)?'ahold':name==='krogertlc'?'kroger':name);
  select.replaceChildren(new Option('Select a related page...',''));
  pages.filter(x=>x.group===group&&typeof x.url==='string'&&x.url.startsWith('/shared/')).forEach(x=>select.add(new Option(x.title||x.url,x.url)));
  for(const opt of select.options)if(decodeURIComponent(opt.value)===current)opt.selected=true;
  if(select.options.length===1)select.options[0].text='No related pages found';
 }).catch(()=>select.replaceChildren(new Option('Page directory unavailable','')));
 select.addEventListener('change',()=>{if(select.value.startsWith('/shared/'))location.assign(select.value)});
})();
