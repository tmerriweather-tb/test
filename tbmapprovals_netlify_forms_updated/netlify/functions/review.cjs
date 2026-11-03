const { getStore } = require('@netlify/blobs');
const crypto = require('node:crypto');
const EMAIL_TO = 'tmerriweather@terraboost.biz';
const json = (statusCode, obj) => ({ statusCode, headers: {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}, body:JSON.stringify(obj) });
const clean = (v,max=200) => String(v??'').slice(0,max);
const esc = s => clean(s,1200).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const validView = v => typeof v==='string' && v.startsWith('/shared/') && v.endsWith('.html') && v.length<240 && !v.includes('..') && !/[?#\\\x00-\x1f]/.test(v);
const viewKey = v => crypto.createHash('sha256').update(v).digest('hex');
const responseState = state => ({decisions:state.decisions||{},emailed:!!state.emailed});
exports.handler = async event => {
 try {
  const method=event.httpMethod;
  if(method!=='GET' && method!=='POST')return json(405,{error:'Method not allowed'});
  const input=method==='POST'?JSON.parse(event.body||'{}'):event.queryStringParameters||{};
  const view=input.view;
  if(!validView(view))return json(400,{error:'Invalid shared page path'});
  const store=getStore('artwork-review-decisions');
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
    const base=process.env.URL||'';
    const details=state.cards.map((c,i)=>`${i+1}. ${c.company} | ${c.artwork||c.id} | ${state.decisions[c.id].decision.toUpperCase()}${state.decisions[c.id].comment?' | Comment: '+state.decisions[c.id].comment:''}`).join('\n');
    const report=[`Shared view: ${view}`,`Completed: ${new Date().toISOString()}`,`Approved: ${approved}`,`Rejected: ${rejected}`,`Total: ${state.cards.length}`,`View URL: ${base+view}`,'','ARTWORK DECISIONS',details].join('\n');
    // Netlify Forms requires a form registered from static HTML at deploy time.
    // Only submit after the server verifies that all artwork has a decision.
    const origin=process.env.URL;
    if(!origin || !/^https:\/\/[^/]+$/.test(origin.replace(/\/$/,''))){
      console.error('Missing/invalid Netlify URL environment variable');emailError=true;
    }else{
      try {
        const body=new URLSearchParams({
          'form-name':'artwork-review-complete',
          subject:`Artwork review complete: ${view.split('/').pop()}`,
          view,completed_at:new Date().toISOString(),
          approved:String(approved),rejected:String(rejected),total:String(state.cards.length),
          view_url:base+view,report
        });
        const result=await fetch(origin.replace(/\/$/,'')+'/review-notification-form.html',{
          method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},
          body:body.toString(),redirect:'manual',signal:AbortSignal.timeout(12000)
        });
        if(!result.ok && !(result.status>=300&&result.status<400))throw new Error('Netlify Forms HTTP '+result.status);
        state.emailed=true;state.emailedAt=new Date().toISOString();await store.setJSON(key,state);
      }catch(e){console.error('Netlify Forms notification submission failed',e);emailError=true;}
    }
  }
  return json(200,{...responseState(state),complete,emailError});
 }catch(err){console.error('Review function failed',err);return json(500,{error:'Review service failed. Please try again.'});}
};
