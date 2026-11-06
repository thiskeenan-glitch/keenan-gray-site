// Bounded public-web discovery, with explicit identity-ambiguity labeling.
// Search snippets are leads, not independent proof of identity or factual errors.
import {safePublicUrl} from "./identity-discovery.mjs";

const text=(v,max=300)=>String(v??"").replace(/\s+/g," ").trim().slice(0,max);
const norm=v=>text(v,1000).normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const words=v=>norm(v).split(/[^a-z0-9]+/).filter(x=>x.length>2);
const exact=(hay,needle)=>!!needle&&norm(hay).includes(norm(needle));
const hostname=u=>{try{return new URL(u).hostname.toLowerCase().replace(/^www[.]/,"");}catch{return "";}};
function sameLink(a,b){
 try{const x=new URL(a),y=new URL(b);
  return hostname(x.href)===hostname(y.href)&&decodeURIComponent(x.pathname).replace(/\/$/,"").toLowerCase()===decodeURIComponent(y.pathname).replace(/\/$/,"").toLowerCase();
 }catch{return false;}
}
function sourceType(host){
 if(/(^|[.])(imdb[.]com|themoviedb[.]org|letterboxd[.]com|filmfreeway[.]com|vimeo[.]com|youtube[.]com|linkedin[.]com|github[.]com|behance[.]net|orcid[.]org|researchgate[.]net)$/.test(host))return "professional";
 if(/(^|[.])(wikipedia[.]org|wikidata[.]org|openalex[.]org)$/.test(host))return "knowledge";
 if(/(^|[.])(instagram[.]com|facebook[.]com|tiktok[.]com|x[.]com|twitter[.]com|threads[.]net)$/.test(host))return "social";
 return "web";
}
export function researchQueries({name,link=null,anchor=null},site=null){
 const n=text(name,100).replace(/["\\\n\r]/g," ");
 const q=['"'+n+'"'];
 const host=hostname(link||"");
 if(host&&anchor?.kind==="website")q.push('"'+n+'" "'+host+'"');
 const rawTitle=site?.ok?text(site.parsed?.title,150):"";
 const role=rawTitle.split(/[|·–—]/).map(x=>x.trim()).filter(x=>x.length>=5&&!norm(x).includes(norm(n))).sort((a,b)=>a.length-b.length)[0]||"";
 const stop=new Set(["home","homepage","official","portfolio","website","welcome","site","the","and"]);
 const roleWords=words(role).filter(x=>!stop.has(x)).slice(0,3);
 if(roleWords.length)q.push('"'+n+'" '+roleWords.join(" "));
 q.push('"'+n+'" (profile OR credits OR interview OR award)');
 return [...new Set(q)].slice(0,4);
}
export function organizeWebResults(batches,{name,link=null,site=null}={}){
 const candidates=new Map(),fullName=norm(name),rootHost=hostname(link||"");
 const siteLinks=[...(site?.parsed?.sameAs||[]),...(site?.parsed?.outlinks||[])].slice(0,70);
 let rawCount=0;
 for(const batch of batches||[]){
  if(!batch||!Array.isArray(batch.results))continue;
  for(const item of batch.results.slice(0,20)){
   rawCount++;
   const title=text(item.title,170),description=text(item.description,360);
   let url;try{url=safePublicUrl(text(item.url,1100));}catch{continue;}
   const host=hostname(url);
   const nameInTitle=exact(title,fullName),nameInDescription=exact(description,fullName);
   const linked=siteLinks.some(known=>sameLink(url,known));
   const sameOfficialSite=!!rootHost&&host===rootHost;
   if(!nameInTitle&&!nameInDescription&&!linked&&!sameOfficialSite)continue;
   const key=host+new URL(url).pathname.replace(/\/$/,"").toLowerCase();
   const existing=candidates.get(key);
   if(existing){existing.queryHits++;if(description.length>existing.description.length)existing.description=description;continue;}
   candidates.set(key,{url,title,description,host,sourceType:sourceType(host),queryHits:1,
    nameInTitle,nameInDescription,linkedFromWebsite:linked,isSuppliedSite:sameOfficialSite});
  }
 }
 const pageTitle=norm(site?.parsed?.title||"");
 const contextTokens=words(pageTitle.replace(norm(name),"")).filter(w=>w.length>=4&&!["official","homepage","website","portfolio"].includes(w)).slice(0,5);
 const results=[...candidates.values()].map(item=>{
  const pageWords=new Set(words(item.title+" "+item.description));
  const overlap=contextTokens.filter(w=>pageWords.has(w));
  const citesWebsite=!!rootHost&&(exact(item.title,rootHost)||exact(item.description,rootHost));
  const score=Math.min(12,(item.nameInTitle?3:item.nameInDescription?1:0)+(item.linkedFromWebsite?6:0)+(item.isSuppliedSite?5:0)+(citesWebsite?3:0)+Math.min(overlap.length,2)+(item.queryHits>1?1:0));
  const reasons=[];
  if(item.linkedFromWebsite)reasons.push("Linked from supplied website");
  if(item.isSuppliedSite)reasons.push("Supplied website");
  if(item.nameInTitle)reasons.push("Full name in page title");
  else if(item.nameInDescription)reasons.push("Full name in search excerpt");
  if(citesWebsite&&!item.isSuppliedSite)reasons.push("Mentions supplied website");
  if(overlap.length)reasons.push("Shares professional context");
  const connection=item.isSuppliedSite?"anchor":item.linkedFromWebsite?"linked":citesWebsite&&item.nameInTitle?"strong_candidate":"unverified";
  return {...item,label:item.title||item.host,match:"search_candidate",status:"unverified",connection,
   score,reasons,contextOverlap:overlap};
 }).sort((a,b)=>b.score-a.score||b.queryHits-a.queryHits||a.host.localeCompare(b.host)).slice(0,36);
 return {results,rawCount,retainedCount:results.length,counts:{
  linked:results.filter(x=>["linked","anchor"].includes(x.connection)).length,
  candidates:results.filter(x=>!["linked","anchor"].includes(x.connection)).length,
  professional:results.filter(x=>x.sourceType==="professional").length,
  web:results.filter(x=>x.sourceType==="web").length
 }};
}
export function normalizeBraveResponse(data){
 return (Array.isArray(data?.web?.results)?data.web.results:[]).slice(0,20)
  .map(x=>({url:x?.url,title:x?.title,description:x?.description}))
  .filter(x=>typeof x.url==="string"&&typeof x.title==="string");
}
