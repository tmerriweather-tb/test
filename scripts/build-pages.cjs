// Run at Netlify build time: node scripts/build-pages.cjs
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const shared=path.join(root,'shared');
const pages=[];
function groupForName(name){
 const key=String(name||'').split('/').pop().replace(/\.html?$/i,'').split('_')[0].trim().toLowerCase().replace(/[^a-z0-9]/g,'');
 if(['ahold','giant','giantfoods','martins','stopshop'].includes(key))return 'ahold';
 if(key==='kroger'||key==='krogertlc')return 'kroger';
 return key;
}
function walk(dir,parts=[]){
  if(!fs.existsSync(dir))return;
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(entry.name.startsWith('.'))continue;
    const next=[...parts,entry.name];
    if(entry.isDirectory())walk(path.join(dir,entry.name),next);
    else if(entry.isFile() && /\.html?$/i.test(entry.name)){
      const url='/shared/'+next.map(encodeURIComponent).join('/');
      const title=entry.name.replace(/\.html?$/i,'').replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim();
      pages.push({title,url,group:groupForName(entry.name)});
    }
  }
}
walk(shared);
pages.sort((a,b)=>a.title.localeCompare(b.title,undefined,{numeric:true}));
fs.writeFileSync(path.join(root,'pages.json'),JSON.stringify({pages},null,2)+'\n');
console.log('Generated pages.json with '+pages.length+' shared HTML pages');

// Give newly added standalone shared HTML pages the same group-aware navigation.
const navCss='<style id="shared-page-nav-styles">.shared-page-nav{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-left:auto;padding:2px 0}.shared-page-nav label{font-size:.8rem;font-weight:800;color:#0f3460}.shared-page-nav select{max-width:340px;min-width:190px;padding:9px 11px;border:1px solid #d4d8df;border-radius:8px;background:#fff;color:#182a41;font-weight:600;font-size:.85rem}@media(max-width:700px){.shared-page-nav{margin-left:0;width:100%}.shared-page-nav select{flex:1;min-width:0;max-width:100%}}</style>';
const navHtml='<div class="shared-page-nav" id="shared-page-nav"><label for="shared-page-nav-select">Related Approval Pages</label><select id="shared-page-nav-select" aria-label="Navigate to related approvals"><option value="">Loading pages...</option></select></div>';
function inject(dir){
 if(!fs.existsSync(dir))return;
 for(const e of fs.readdirSync(dir,{withFileTypes:true})){
  const f=path.join(dir,e.name);
  if(e.isDirectory()){inject(f);continue;}
  if(!e.isFile()||!(/\.html?$/i.test(e.name)))continue;
  let html=fs.readFileSync(f,'utf8');
  if(html.includes('id="shared-page-nav-select"')||html.includes('id="shared-page-navigation"'))continue;
  if(!html.includes('</head>')||!html.includes('</body>'))continue;
  html=html.replace('</head>',navCss+'</head>');
  if(html.includes('<div class="toolbar">'))html=html.replace('<div class="toolbar">','<div class="toolbar">'+navHtml);
  else html=html.replace(/<body([^>]*)>/i,'<body$1>'+navHtml);
  html=html.replace('</body>','<script src="/shared-navigation.js" defer></script></body>');
  fs.writeFileSync(f,html);
 }
}
inject(shared);

const downloadCss=Buffer.from("PHN0eWxlIGlkPSJzaGFyZWQtZG93bmxvYWQtc3R5bGVzIj4KLnNoYXJlZC1kb3dubG9hZC1hY3Rpb25ze2Rpc3BsYXk6ZmxleDthbGlnbi1pdGVtczpjZW50ZXI7Z2FwOjlweDtmbGV4LXdyYXA6d3JhcDtwYWRkaW5nOjJweCAwfQouc2hhcmVkLWRvd25sb2FkLWFjdGlvbnMgYnV0dG9ue2JhY2tncm91bmQ6IzE0M2M2Yjtjb2xvcjp3aGl0ZTtib3JkZXI6MDtib3JkZXItcmFkaXVzOjdweDtwYWRkaW5nOjlweCAxM3B4O2ZvbnQtc2l6ZTouODVyZW07Zm9udC13ZWlnaHQ6NzAwO2N1cnNvcjpwb2ludGVyfQouc2hhcmVkLWRvd25sb2FkLWFjdGlvbnMgYnV0dG9uOmhvdmVye2JhY2tncm91bmQ6IzIzNTY4ZX0KQG1lZGlhIHByaW50ewogQHBhZ2V7c2l6ZTpsZXR0ZXIgbGFuZHNjYXBlO21hcmdpbjowLjNpbn0KIGh0bWwsYm9keXtiYWNrZ3JvdW5kOiNmZmYhaW1wb3J0YW50O21hcmdpbjowIWltcG9ydGFudDtwYWRkaW5nOjAhaW1wb3J0YW50fQogLnRvb2xiYXIsLmZpbHRlci1iYXIsLnBhZ2luYXRpb24sLnN0YXR1cy1saW5lLC5zaGFyZWQtZG93bmxvYWQtYWN0aW9ucywuc2hhcmVkLXBhZ2UtbmF2LC5jYXJkLWFjdGlvbnMsLnByZXZpZXctb3Blbi1idG4sZGlhbG9ne2Rpc3BsYXk6bm9uZSFpbXBvcnRhbnR9CiBoZWFkZXJ7ZGlzcGxheTpub25lIWltcG9ydGFudH0KIC5ncmlke2Rpc3BsYXk6bm9uZSFpbXBvcnRhbnR9CiAjc2hhcmVkLXByaW50LWdyaWR7ZGlzcGxheTpibG9jayFpbXBvcnRhbnQ7cGFkZGluZzowIWltcG9ydGFudDttYXJnaW46MCFpbXBvcnRhbnR9CiAjc2hhcmVkLXByaW50LWdyaWQgLnNoYXJlZC1wcmludC1zaGVldHtkaXNwbGF5OmdyaWQhaW1wb3J0YW50O2dyaWQtdGVtcGxhdGUtY29sdW1uczpyZXBlYXQoMixtaW5tYXgoMCwxZnIpKSFpbXBvcnRhbnQ7Z3JpZC10ZW1wbGF0ZS1yb3dzOnJlcGVhdCgyLG1pbm1heCgwLDFmcikpIWltcG9ydGFudDtnYXA6MC4xMmluIWltcG9ydGFudDt3aWR0aDoxMDAlIWltcG9ydGFudDtoZWlnaHQ6Ny44NWluIWltcG9ydGFudDtib3gtc2l6aW5nOmJvcmRlci1ib3ghaW1wb3J0YW50O2JyZWFrLWFmdGVyOnBhZ2U7cGFnZS1icmVhay1hZnRlcjphbHdheXM7b3ZlcmZsb3c6aGlkZGVufQogI3NoYXJlZC1wcmludC1ncmlkIC5zaGFyZWQtcHJpbnQtc2hlZXQ6bGFzdC1jaGlsZHticmVhay1hZnRlcjphdXRvO3BhZ2UtYnJlYWstYWZ0ZXI6YXV0b30KICNzaGFyZWQtcHJpbnQtZ3JpZCAuY2FyZHtib3gtc2l6aW5nOmJvcmRlci1ib3ghaW1wb3J0YW50O3dpZHRoOjEwMCUhaW1wb3J0YW50O21heC13aWR0aDoxMDAlIWltcG9ydGFudDttaW4td2lkdGg6MCFpbXBvcnRhbnQ7bWluLWhlaWdodDowIWltcG9ydGFudDtoZWlnaHQ6MTAwJSFpbXBvcnRhbnQ7bWF4LWhlaWdodDoxMDAlIWltcG9ydGFudDtvdmVyZmxvdzpoaWRkZW4haW1wb3J0YW50O2JyZWFrLWluc2lkZTphdm9pZCFpbXBvcnRhbnQ7cGFnZS1icmVhay1pbnNpZGU6YXZvaWQhaW1wb3J0YW50O2JveC1zaGFkb3c6bm9uZSFpbXBvcnRhbnQ7Ym9yZGVyOjFweCBzb2xpZCAjZGRkIWltcG9ydGFudDttYXJnaW46MCFpbXBvcnRhbnR9CiAjc2hhcmVkLXByaW50LWdyaWQgLmNhcmQgaW1nLCNzaGFyZWQtcHJpbnQtZ3JpZCAuY2FyZCB2aWRlb3ttYXgtd2lkdGg6MTAwJSFpbXBvcnRhbnQ7bWF4LWhlaWdodDoxMDAlIWltcG9ydGFudDtvYmplY3QtZml0OmNvbnRhaW4haW1wb3J0YW50fQogI3NoYXJlZC1wcmludC1ncmlkIC5jYXJkLWJvZHl7bWluLXdpZHRoOjAhaW1wb3J0YW50fQogKnstd2Via2l0LXByaW50LWNvbG9yLWFkanVzdDpleGFjdDtwcmludC1jb2xvci1hZGp1c3Q6ZXhhY3R9Cn0KI3NoYXJlZC1wcmludC1ncmlke2Rpc3BsYXk6bm9uZX0KPC9zdHlsZT4=","base64").toString("utf8");

const downloadBar=Buffer.from("PGRpdiBjbGFzcz0ic2hhcmVkLWRvd25sb2FkLWFjdGlvbnMiIGlkPSJzaGFyZWQtZG93bmxvYWQtYWN0aW9ucyI+PGJ1dHRvbiB0eXBlPSJidXR0b24iIG9uY2xpY2s9ImRvd25sb2FkU2hhcmVkUGRmKCkiIHRpdGxlPSJPcGVuIHByaW50IGRpYWxvZyB0byBzYXZlIGEgUERGIj5Eb3dubG9hZCBQREY8L2J1dHRvbj48YnV0dG9uIHR5cGU9ImJ1dHRvbiIgb25jbGljaz0iZG93bmxvYWRTaGFyZWRIdG1sKCkiIHRpdGxlPSJTYXZlIHRoaXMgZmlsdGVyZWQgdmlldyBhcyBhIHN0YW5kYWxvbmUgSFRNTCBmaWxlIj5Eb3dubG9hZCBIVE1MPC9idXR0b24+PC9kaXY+","base64").toString("utf8");

const downloadScript=Buffer.from("PHNjcmlwdCBpZD0ic2hhcmVkLWRvd25sb2FkLXNjcmlwdCI+CihmdW5jdGlvbigpewogbGV0IHByaW50aW5nPWZhbHNlOwogY29uc3QgY2xlYW51cD0oKT0+e2NvbnN0IGdyaWQ9ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NoYXJlZC1wcmludC1ncmlkJyk7aWYoZ3JpZClncmlkLnJlbW92ZSgpO3ByaW50aW5nPWZhbHNlO307CiB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignYWZ0ZXJwcmludCcsY2xlYW51cCk7CiB3aW5kb3cuZG93bmxvYWRTaGFyZWRQZGY9ZnVuY3Rpb24oKXsKICBpZihwcmludGluZylyZXR1cm47cHJpbnRpbmc9dHJ1ZTsKICB0cnl7CiAgIGNsZWFudXAoKTtwcmludGluZz10cnVlOwogICBjb25zdCB0YXJnZXQ9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7dGFyZ2V0LmlkPSdzaGFyZWQtcHJpbnQtZ3JpZCc7CiAgIGNvbnN0IGdyaWQ9ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2dyaWQnKTsKICAgaWYoZ3JpZCYmdHlwZW9mIGZpbHRlcmVkIT09J3VuZGVmaW5lZCcmJnR5cGVvZiByZW5kZXJHcmlkPT09J2Z1bmN0aW9uJyYmdHlwZW9mIGN1cnJlbnRQYWdlIT09J3VuZGVmaW5lZCcmJnR5cGVvZiBQQUdFX1NJWkUhPT0ndW5kZWZpbmVkJyl7CiAgICBjb25zdCBwcmV2aW91cz1jdXJyZW50UGFnZTsKICAgIHRyeXsKICAgICBjb25zdCBjb3VudD1NYXRoLm1heCgxLE1hdGguY2VpbChmaWx0ZXJlZC5sZW5ndGgvUEFHRV9TSVpFKSk7CiAgICAgZm9yKGxldCBpPTE7aTw9Y291bnQ7aSsrKXtjdXJyZW50UGFnZT1pO3JlbmRlckdyaWQoKTtjb25zdCBjaHVuaz1ncmlkLmNsb25lTm9kZSh0cnVlKTtjaHVuay5xdWVyeVNlbGVjdG9yQWxsKCdpbWcnKS5mb3JFYWNoKGltZz0+e2ltZy5sb2FkaW5nPSdlYWdlcic7aW1nLnJlbW92ZUF0dHJpYnV0ZSgnb25jbGljaycpO30pO2NodW5rLnF1ZXJ5U2VsZWN0b3JBbGwoJ3ZpZGVvJykuZm9yRWFjaCh2aWRlbz0+e3ZpZGVvLnJlbW92ZUF0dHJpYnV0ZSgnb25jbGljaycpO30pO3doaWxlKGNodW5rLmZpcnN0Q2hpbGQpdGFyZ2V0LmFwcGVuZENoaWxkKGNodW5rLmZpcnN0Q2hpbGQpO30KICAgIH1maW5hbGx5e2N1cnJlbnRQYWdlPXByZXZpb3VzO3JlbmRlckdyaWQoKTt9CiAgIH1lbHNlIGlmKGdyaWQpe3RhcmdldC5pbm5lckhUTUw9Z3JpZC5pbm5lckhUTUw7fQogICAvLyBFeHBsaWNpdGx5IHBhZ2luYXRlIGF0IGZvdXIgY2FyZHMgcGVyIGxhbmRzY2FwZSBzaGVldC4KICAgY29uc3QgY2FyZHM9QXJyYXkuZnJvbSh0YXJnZXQuY2hpbGRyZW4pOwogICB0YXJnZXQucmVwbGFjZUNoaWxkcmVuKCk7CiAgIGZvcihsZXQgaT0wO2k8Y2FyZHMubGVuZ3RoO2krPTQpewogICAgY29uc3Qgc2hlZXQ9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2VjdGlvbicpO3NoZWV0LmNsYXNzTmFtZT0nc2hhcmVkLXByaW50LXNoZWV0JzsKICAgIGNhcmRzLnNsaWNlKGksaSs0KS5mb3JFYWNoKGNhcmQ9PnNoZWV0LmFwcGVuZENoaWxkKGNhcmQpKTsKICAgIHRhcmdldC5hcHBlbmRDaGlsZChzaGVldCk7CiAgIH0KICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0YXJnZXQpOwogICBzZXRUaW1lb3V0KCgpPT57d2luZG93LnByaW50KCk7fSw2MDApOwogIH1jYXRjaChlcnIpe2NsZWFudXAoKTthbGVydCgnVW5hYmxlIHRvIHByZXBhcmUgUERGOiAnK2Vyci5tZXNzYWdlKTt9CiB9Owogd2luZG93LmRvd25sb2FkU2hhcmVkSHRtbD1hc3luYyBmdW5jdGlvbigpewogIGNvbnN0IG5hbWU9ZGVjb2RlVVJJQ29tcG9uZW50KGxvY2F0aW9uLnBhdGhuYW1lLnNwbGl0KCcvJykucG9wKCl8fCdzaGFyZWQtYXBwcm92YWxzLmh0bWwnKS5yZXBsYWNlKC9bXmEtekEtWjAtOV8uIC1dL2csJ18nKS5yZXBsYWNlKC9cLmh0bWw/JC9pLCcnKSsnLmh0bWwnOwogIHRyeXsKICAgbGV0IHNvdXJjZT0nJzsKICAgaWYoL15odHRwcz86JC8udGVzdChsb2NhdGlvbi5wcm90b2NvbCkpewogICAgY29uc3QgcmVzcG9uc2U9YXdhaXQgZmV0Y2gobG9jYXRpb24uaHJlZix7Y2FjaGU6J25vLXN0b3JlJ30pO2lmKCFyZXNwb25zZS5vayl0aHJvdyBuZXcgRXJyb3IoJ1BhZ2UgdW5hdmFpbGFibGUnKTtzb3VyY2U9YXdhaXQgcmVzcG9uc2UudGV4dCgpOwogICB9ZWxzZXtzb3VyY2U9JzwhRE9DVFlQRSBodG1sPlxuJytkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQub3V0ZXJIVE1MO30KICAgY29uc3QgYmxvYj1uZXcgQmxvYihbc291cmNlXSx7dHlwZTondGV4dC9odG1sO2NoYXJzZXQ9dXRmLTgnfSk7Y29uc3QgdXJsPVVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYik7Y29uc3QgYT1kb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJyk7YS5ocmVmPXVybDthLmRvd25sb2FkPW5hbWU7ZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChhKTthLmNsaWNrKCk7YS5yZW1vdmUoKTtzZXRUaW1lb3V0KCgpPT5VUkwucmV2b2tlT2JqZWN0VVJMKHVybCksMTUwMCk7CiAgfWNhdGNoKGVycil7YWxlcnQoJ0hUTUwgZG93bmxvYWQgZmFpbGVkOiAnK2Vyci5tZXNzYWdlKTt9CiB9Owp9KSgpOwo8L3NjcmlwdD4=","base64").toString("utf8");

function injectDownloads(dir){
 if(!fs.existsSync(dir))return;
 for(const e of fs.readdirSync(dir,{withFileTypes:true})){
  const f=path.join(dir,e.name);
  if(e.isDirectory()){injectDownloads(f);continue;}
  if(!e.isFile()||!/\.html?$/i.test(e.name))continue;
  let html=fs.readFileSync(f,'utf8');
  if(html.includes('id="shared-download-actions"')||!html.includes('</body>'))continue;
  if(html.includes('</head>'))html=html.replace('</head>',downloadCss+'</head>');
  if(html.includes('<div class="toolbar">'))html=html.replace('<div class="toolbar">','<div class="toolbar">'+downloadBar);
  else html=html.replace(/<body([^>]*)>/i,'<body$1>'+downloadBar);
  html=html.replace('</body>',downloadScript+'</body>');
  fs.writeFileSync(f,html);
 }
}
injectDownloads(shared);
