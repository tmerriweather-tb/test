const { getStore } = require('@netlify/blobs');
const crypto = require('node:crypto');
const EMAIL_TO = 'tmerriweather@terraboost.biz';
const json = (statusCode, obj) => ({ statusCode, headers: {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}, body:JSON.stringify(obj) });
const clean = (v,max=200) => String(v??'').slice(0,max);
const esc = s => clean(s,1200).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Netlify Pretty URLs may send extensionless, lowercased paths. Resolve known
// shared pages to their original canonical filename to keep review keys stable.
const knownSharedViews = {"/shared/woodmans_oct2026_weeks01&02.html":"/shared/Woodmans_Oct2026_Weeks01&02.html","/shared/kroger_tlc_oct2026_weeks03&04.html":"/shared/Kroger_TLC_Oct2026_Weeks03&04.html","/shared/martins_oct2026_weeks03&04.html":"/shared/Martins_Oct2026_Weeks03&04.html","/shared/savemart_oct2026_weeks01&02.html":"/shared/SaveMart_Oct2026_Weeks01&02.html","/shared/giant_sept2026_weeks03&04.html":"/shared/Giant_Sept2026_Weeks03&04.html","/shared/heb_august2026.html":"/shared/HEB_August2026.html","/shared/kroger_tlc_oct2026_weeks01&02.html":"/shared/Kroger_TLC_Oct2026_Weeks01&02.html","/shared/milams_oct2026.html":"/shared/Milams_Oct2026.html","/shared/stop&shop_sept2026_weeks03&04.html":"/shared/Stop&Shop_Sept2026_Weeks03&04.html","/shared/quest_shared approvals_june30_to_july31.html":"/shared/Quest_Shared Approvals_June30_to_July31.html","/shared/albertsons_august2026_weeks01&02.html":"/shared/Albertsons_August2026_Weeks01&02.html","/shared/woodmans_sept2026_weeks03&04.html":"/shared/Woodmans_Sept2026_Weeks03&04.html","/shared/stop&shop_oct2026_weeks03&04.html":"/shared/Stop&Shop_Oct2026_Weeks03&04.html","/shared/quest_august2026_weeks03&04.html":"/shared/Quest_August2026_Weeks03&04.html","/shared/quest_august2026_weeks01&02.html":"/shared/Quest_August2026_Weeks01&02.html","/shared/quest_oct2026.html":"/shared/Quest_Oct2026.html","/shared/giantfoods_sept2026_weeks03&04.html":"/shared/GiantFoods_Sept2026_Weeks03&04.html","/shared/albertsons_august2026_weeks03&04.html":"/shared/Albertsons_August2026_Weeks03&04.html","/shared/ahold_sept2026_weeks01&02.html":"/shared/AHOLD_Sept2026_Weeks01&02.html","/shared/martins_oct2026_weeks01&02.html":"/shared/Martins_Oct2026_Weeks01&02.html","/shared/heb_shared approvals_june30_to_july31.html":"/shared/HEB_Shared Approvals_June30_to_July31.html","/shared/savemart_oct2026_weeks03&04.html":"/shared/SaveMart_Oct2026_Weeks03&04.html","/shared/ahold_sept2026_weeks03&04.html":"/shared/AHOLD_Sept2026_Weeks03&04.html","/shared/ahold_mayandjune2026_approvals.html":"/shared/AHOLD_MayAndJune2026_Approvals.html","/shared/giant_oct2026_weeks03&04.html":"/shared/Giant_Oct2026_Weeks03&04.html","/shared/stop&shop_oct2026_weeks01&02.html":"/shared/Stop&Shop_Oct2026_Weeks01&02.html","/shared/milams_sept2026_weeks01&02.html":"/shared/Milams_Sept2026_Weeks01&02.html","/shared/albertsons_sept2026_weeks03&04.html":"/shared/Albertsons_Sept2026_Weeks03&04.html","/shared/giant_oct2026_weeks01&02.html":"/shared/Giant_Oct2026_Weeks01&02.html","/shared/heb_sept2026_weeks03&04.html":"/shared/HEB_Sept2026_Weeks03&04.html","/shared/giantfoods_oct2026_weeks03&04.html":"/shared/GiantFoods_Oct2026_Weeks03&04.html","/shared/giantfoods_oct2026_weeks01&02.html":"/shared/GiantFoods_Oct2026_Weeks01&02.html","/shared/savemart_sept2026_weeks01&02.html":"/shared/SaveMart_Sept2026_Weeks01&02.html","/shared/martins_sept2026_weeks03&04.html":"/shared/Martins_Sept2026_Weeks03&04.html","/shared/albertsons_oct2026_weeks01&02.html":"/shared/Albertsons_Oct2026_Weeks01&02.html","/shared/heb_sept2026_weeks01&02.html":"/shared/HEB_Sept2026_Weeks01&02.html","/shared/kroger_oct2026_weeks03&04.html":"/shared/Kroger_Oct2026_Weeks03&04.html","/shared/albertsons_sept2026_weeks01&02.html":"/shared/Albertsons_Sept2026_Weeks01&02.html","/shared/kroger_sept2026_weeks03&04.html":"/shared/Kroger_Sept2026_Weeks03&04.html","/shared/ahold_shared approvals_june30_to_july31.html":"/shared/AHOLD_Shared Approvals_June30_to_July31.html","/shared/heb_oct2026.html":"/shared/HEB_Oct2026.html","/shared/ahold_august2026_weeks03&04.html":"/shared/AHOLD_August2026_Weeks03&04.html","/shared/kroger_oct2026_weeks01&02.html":"/shared/Kroger_Oct2026_Weeks01&02.html","/shared/quest_mayandjune2026_approvals.html":"/shared/Quest_MayAndJune2026_Approvals.html","/shared/kroger_sept2026_weeks01&02.html":"/shared/Kroger_Sept2026_Weeks01&02.html","/shared/heb_mayandjune2026_approvals.html":"/shared/HEB_MayAndJune2026_Approvals.html","/shared/la fitness_sept2026_weeks03&04.html":"/shared/LA Fitness_Sept2026_Weeks03&04.html","/shared/ahold_august2026_weeks01&02.html":"/shared/AHOLD_August2026_Weeks01&02.html","/shared/savemart_sept2026_weeks03&04.html":"/shared/SaveMart_Sept2026_Weeks03&04.html"};
function normalizeView(value) {
  if (typeof value !== 'string' || !value.trim() || value.length > 2048) return null;
  let path = value.trim();
  try {
    if (/^https?:\/\//i.test(path)) path = new URL(path).pathname;
    else path = path.split(/[?#]/, 1)[0];
    path = decodeURIComponent(path);
  } catch (_) { return null; }
  if (!path.startsWith('/')) path = '/' + path;
  if (/[\\\x00-\x1f]/.test(path) || path.length >= 240) return null;
  const segments = path.split('/');
  if (segments.length !== 3 || segments[1].toLowerCase() !== 'shared' || !segments[2] || segments[2] === '.' || segments[2] === '..') return null;
  let filename = segments[2];
  if (!/\.html$/i.test(filename)) {
    if (filename.includes('.')) return null;
    filename += '.html';
  }
  const normalized = '/shared/' + filename;
  return knownSharedViews[normalized.toLowerCase()] || normalized;
}
const viewKey = v => crypto.createHash('sha256').update(v).digest('hex');
const responseState = state => ({decisions:state.decisions||{},emailed:!!state.emailed,notificationStatus:state.emailed?'submitted':(state.notificationStatus||'pending'),notificationError:state.notificationError||null});
// In some Netlify deploy contexts the Blobs runtime metadata is not injected.
// Prefer explicit server-side credentials when provided; otherwise use Netlify's automatic context.
function reviewStore() {
  const siteID = process.env.REVIEW_BLOBS_SITE_ID || process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
  const token = process.env.REVIEW_BLOBS_TOKEN || process.env.NETLIFY_AUTH_TOKEN;
  if (siteID && token) return getStore({ name: 'artwork-review-decisions', siteID, token });
  return getStore('artwork-review-decisions');
}

exports.handler = async event => {
 try {
  const method=event.httpMethod;
  if(method!=='GET' && method!=='POST')return json(405,{error:'Method not allowed'});
  const input=method==='POST'?JSON.parse(event.body||'{}'):event.queryStringParameters||{};
  const view=normalizeView(input.view);
  if(!view)return json(400,{error:'Invalid shared page path',code:'INVALID_VIEW',received:typeof input.view==='string'?input.view.slice(0,300):null});
  const store=reviewStore();
  const key=viewKey(view);
  let state=await store.get(key,{type:'json'})||{view,decisions:{},emailed:false};
  if(method==='GET')return json(200,responseState(state));
  if(!Array.isArray(input.cards)||!input.cards.length||input.cards.length>500)return json(400,{error:'Invalid artwork list'});
  const cards=input.cards.map(c=>({id:clean(c.id,60),company:clean(c.company,180),artwork:clean(c.artwork,500)}));
  if(cards.some(c=>!c.id||!c.company)||new Set(cards.map(c=>c.id)).size!==cards.length)return json(400,{error:'Invalid artwork identifiers'});
  if(!cards.some(c=>c.id===input.id)||!['approved','rejected'].includes(input.decision))return json(400,{error:'Invalid decision'});
  // The initial list is frozen so later requests cannot silently change review completion totals.
  if(!state.cards){state.cards=cards;}
  const expected=new Set(state.cards.map(c=>c.id));
  if(cards.length!==expected.size||cards.some(c=>!expected.has(c.id))||!expected.has(input.id))return json(409,{error:'Artwork list changed. Contact the dashboard administrator.'});
  state.decisions[input.id]={decision:input.decision,comment:clean(input.comment,1000),updatedAt:new Date().toISOString()};
  const complete=state.cards.every(c=>['approved','rejected'].includes(state.decisions[c.id]?.decision));
  await store.setJSON(key,state);
  let emailError=false;
  if(complete&&!state.emailed){
    const approved=state.cards.filter(c=>state.decisions[c.id].decision==='approved').length;
    const rejected=state.cards.length-approved;
    const now=new Date().toISOString();
    const base=(process.env.URL||'').replace(/\/$/,'');
    const rows=state.cards.map((c,i)=>({number:i+1,company:c.company,artwork:c.artwork||c.id,status:state.decisions[c.id].decision.toUpperCase(),comment:state.decisions[c.id].comment||'',reviewed_at:state.decisions[c.id].updatedAt||''}));
    const details=rows.map(r=>`${r.number}. ${r.company} | ${r.artwork} | ${r.status}${r.comment?' | Comment: '+r.comment:''}`).join('\n');
    const venue=view.split('/').pop().replace(/\.html$/i,'').replace(/_/g,' ');
    const report=[`Artwork review completed for ${venue}`,`Review completed: ${now}`,`Total artworks: ${state.cards.length}`,`Approved: ${approved}`,`Rejected: ${rejected}`,'','Individual artwork decisions:',details].join('\n');
    // Submit a single consolidated report only after server-side completion.
    // Netlify's static form declaration is in review-notification-form.html.
    try {
      if(!/^https:\/\/[^/]+$/.test(base)) throw new Error('Netlify URL environment variable is missing or invalid');
      const fields={
        'form-name':'artwork-review-complete',
        subject:`Completed artwork review - ${venue}`,
        venue,review_status:'Complete',view,completed_at:now,
        approved:String(approved),rejected:String(rejected),total:String(state.cards.length),
        view_url:base+view,
        summary:`Completed review for ${venue}: ${approved} approved and ${rejected} rejected, ${state.cards.length} artworks total.`,
        report,artwork_decisions:details
      };
      // Netlify's documented AJAX form pattern posts to the site root.
      const result=await fetch(base+'/',{
        method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
        body:new URLSearchParams(fields).toString(),redirect:'manual',signal:AbortSignal.timeout(12000)
      });
      // Accept only typical success responses. An HTML response alone cannot
      // prove that Netlify registered the form or delivered an email.
      if(![200,201,202,301,302,303].includes(result.status))throw new Error('Netlify Forms HTTP '+result.status);
      state.emailed=true;state.emailedAt=now;state.notificationStatus='submitted';delete state.notificationError;
      await store.setJSON(key,state);
      console.log('Artwork review report submitted to Netlify Forms',{view,total:rows.length,approved,rejected,httpStatus:result.status});
    }catch(e){
      console.error('Netlify Forms notification submission failed',{view,error:String(e?.message||e)});
      emailError=true;state.notificationStatus='failed';state.notificationError=clean(e?.message||e,250);
      await store.setJSON(key,state);
    }
  }
  return json(200,{...responseState(state),complete,emailError});
 }catch(err){
  console.error('Review function failed',err);
  if(err?.name==='MissingBlobsEnvironmentError' || /not been configured to use Netlify Blobs/.test(String(err?.message||''))) {
    return json(503,{error:'Review storage is not configured. Set REVIEW_BLOBS_SITE_ID and REVIEW_BLOBS_TOKEN in Netlify environment variables, then redeploy.',code:'BLOBS_NOT_CONFIGURED'});
  }
  return json(500,{error:'Review service failed. Please try again.'});
 }
};
