'use strict';
const {createHash} = require('node:crypto');
function sha256(s) { return createHash('sha256').update(s, 'utf8').digest('hex'); }
function parseUrl(s) { const u = new URL(s); if (!['https:', 'http:'].includes(u.protocol)) throw new Error('Only HTTP and HTTPS URLs are supported.'); if (u.username || u.password) throw new Error('URLs with embedded credentials are not supported.'); u.hash=''; return u.toString(); }
function configProfile(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Expected a configuration object.');
  const keys=Object.keys(input).sort((a,b)=>a.toLowerCase()<b.toLowerCase()?-1:a.toLowerCase()>b.toLowerCase()?1:0);
  const ordered={}; for(const key of keys){const v=input[key]; if(!(typeof v==='string'||typeof v==='boolean'||(typeof v==='number'&&Number.isSafeInteger(v))||(Array.isArray(v)&&v.length===0))) throw new Error('Unsupported value for '+key); ordered[key]=v;}
  if(typeof ordered.startURL!=='string') throw new Error('Missing startURL.');
  const startUrl=parseUrl(ordered.startURL); const normalized=JSON.stringify(ordered).replace(/ /g,'').replace(/\n/g,'');
  const configHash=sha256(normalized); return {startUrl, configHash, configKeyHash:sha256(startUrl+configHash)};
}
function rewriteHeaders(details, profile) {
  const headers={...details.requestHeaders};
  if(profile && details.url === profile.startUrl && ['mainFrame','subFrame','xhr'].includes(details.resourceType)) {
    for(const k of Object.keys(headers)) if(k.toLowerCase()==='x-safeexambrowser-configkeyhash') delete headers[k];
    headers['X-SafeExamBrowser-ConfigKeyHash']=profile.configKeyHash;
  }
  return headers;
}
module.exports={sha256,parseUrl,configProfile,rewriteHeaders};
