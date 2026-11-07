// Identity Lab general public-identity discovery. Read only, no external edits.
// The pilot fetches fixed-source Wikidata and (optionally) a licensed search API.
// Arbitrary supplied websites are NOT fetched, to avoid server-side request forgery.
import {parseIntake,cleanWikidataSearch,identifyWikidataAnchors,cleanSearchResults,reportFromSignals} from "../lib/identity-discovery.mjs";
import {inspectPublicHomepage} from "../lib/safe-site-inspection.mjs";
import {researchQueries,organizeWebResults,normalizeBraveResponse} from "../lib/web-research.mjs";
import {analyzeIdentity,findAnchoredImdb,imdbResearchQueries} from "../lib/identity-intelligence.mjs";
const limit=12000;
async function fetchJson(url,{headers={},timeout=4500}={}){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);
  try{
    const response=await fetch(url,{method:"GET",redirect:"error",headers:{Accept:"application/json",...headers},signal:controller.signal});
    if(!response.ok)throw new Error("Remote source HTTP "+response.status);
    const declared=Number(response.headers.get("content-length")||0);
    if(declared>limit*5)throw new Error("Remote source response too large");
    const text=(await response.text());
    if(text.length>limit*5)throw new Error("Remote source response too large");
    return JSON.parse(text);
  }finally{clearTimeout(timer);}
}
async function wikidataCandidates(name,anchor){
  const base="https://www.wikidata.org/w/api.php";
  const q=new URLSearchParams({action:"wbsearchentities",search:name,language:"en",type:"item",limit:"8",format:"json",origin:"*"});
  const agent="IdentityLabDiscovery/0.2 (public professional identity audits; contact via website)";
  const data=await fetchJson(base+"?"+q,{headers:{"User-Agent":agent},timeout:5000});
  let records=cleanWikidataSearch(data,name);
  if(records.length){
    try{
      const params=new URLSearchParams({action:"wbgetentities",ids:records.map(x=>x.id).join("|"),props:"claims",format:"json"});
      const info=await fetchJson(base+"?"+params,{headers:{"User-Agent":agent},timeout:4500});
      records=identifyWikidataAnchors(records,info.entities,anchor?.u||null);
    }catch{/* preserve tentative name candidates if identifier lookups fail */}
  }
  return records;
}
async function searchCandidates(input,site){
 const key=process.env.IDLAB_BRAVE_SEARCH_KEY;
 if(!key)return {results:[],status:"not_configured",queryCount:0,rawCount:0,sourceCount:0,
  message:"Indexed-web search is not connected to this pilot. This scan cannot discover your full professional footprint."};
 const queries=researchQueries(input,site);
 const completed=await Promise.allSettled(queries.map(async q=>{
  const params=new URLSearchParams({q,count:"20",safesearch:"moderate",text_decorations:"false",result_filter:"web"});
  const data=await fetchJson("https://api.search.brave.com/res/v1/web/search?"+params,{
   headers:{"X-Subscription-Token":key},timeout:5700});
  return {query:q,results:normalizeBraveResponse(data)};
 }));
 const successful=completed.filter(x=>x.status==="fulfilled").map(x=>x.value);
 const research=organizeWebResults(successful,{name:input.name,link:input.link,site});
 return {results:research.results,status:!successful.length?"error":successful.length<queries.length?"partial":"ok",
  queryCount:successful.length,attemptedQueries:queries.length,rawCount:research.rawCount,
  sourceCount:research.retainedCount,counts:research.counts,
  message:successful.length?"Web results are public leads, not independently verified identity matches.":"The external search provider did not return results."};
}

// Targeted read-only indexed excerpts for a uniquely anchor-linked IMDb person profile.
// Search-provider excerpts are not substituted for the live IMDb biography.
async function imdbEvidence(input,site){
 const profile=findAnchoredImdb({link:input.link,site});
 if(!profile)return {profile:null,results:[],status:"no_anchored_profile"};
 const key=process.env.IDLAB_BRAVE_SEARCH_KEY;
 if(!key)return {profile,results:[],status:"not_configured"};
 const queries=imdbResearchQueries(input.name,profile.id);
 const checks=await Promise.allSettled(queries.map(async q=>{
  const params=new URLSearchParams({q,count:"12",safesearch:"moderate",text_decorations:"false",result_filter:"web"});
  const data=await fetchJson("https://api.search.brave.com/res/v1/web/search?"+params,{
   headers:{"X-Subscription-Token":key},timeout:5500});
  return normalizeBraveResponse(data);
 }));
 const fulfilled=checks.filter(x=>x.status==="fulfilled").flatMap(x=>x.value);
 const seen=new Set();
 const results=fulfilled.filter(x=>{
  // Preserve different indexed excerpts for the same IMDb person page:
  // one query may expose the biography while another exposes directing credits.
  const url=String(x.url||""),excerpt=String(x.description||"").trim();
  const key=url+"|"+excerpt;
  if(seen.has(key))return false;
  seen.add(key);return true;
 }).slice(0,20);
 return {profile,results,status:!fulfilled.length?"not_found":checks.some(x=>x.status==="rejected")?"partial":"ok"};
}

const buckets=new Map();
function permit(request){
  const forwarded=String(request.headers?.["x-forwarded-for"]||"").split(",")[0].trim();
  const ip=forwarded&&forwarded.length<80?forwarded:String(request.socket?.remoteAddress||"unknown");
  const key=ip.slice(0,80),now=Date.now();
  const item=buckets.get(key)||{count:0,reset:now+60000};
  if(item.reset<now){item.count=0;item.reset=now+60000;}
  item.count++;buckets.set(key,item);
  if(buckets.size>500){for(const [k,v] of buckets){if(v.reset<now)buckets.delete(k);}if(buckets.size>500)buckets.clear();}
  return item.count<=10;
}
export default async function handler(req,res){
  res.setHeader("Cache-Control","no-store");
  res.setHeader("X-Content-Type-Options","nosniff");
  if(req.method!=="POST"){res.setHeader("Allow","POST");return res.status(405).json({error:"Use POST."});}
  // In-memory protection is per instance only; add a durable edge/WAF limit before a public launch.
  if(!permit(req))return res.status(429).json({error:"Too many audits. Please retry later."});
  let input;
  try{
    const body=typeof req.body==="string"?JSON.parse(req.body):req.body||{};
    if(JSON.stringify(body).length>2800)throw new Error("Request is too large.");
    input=parseIntake(body);
  }catch(e){return res.status(400).json({error:e.message||"Invalid audit request."});}
  const [wikidata,website]=await Promise.allSettled([wikidataCandidates(input.name,input.anchor),
   input.anchor?.kind==="website"?inspectPublicHomepage(input.link):Promise.resolve(null)]);
  const records=wikidata.status==="fulfilled"?wikidata.value:[];
  const site=website.status==="fulfilled"?website.value:{ok:false,url:input.link||null,error:"Website inspection failed before completion."};
  const search=await searchCandidates(input,site).catch(()=>({results:[],status:"error",queryCount:0,sourceCount:0,message:"Web search temporarily unavailable."}));
  const report=reportFromSignals({input,site,wikidata:records,searchResults:search.results,searchStatus:search.status,wikidataStatus:wikidata.status==="fulfilled"?"ok":"error"});
  const imdb=await imdbEvidence(input,site).catch(()=>({profile:null,results:[],status:"error"}));
  report.intelligence=analyzeIdentity({input,site,wikidata:records,web:search.results,imdbSearch:imdb.results});
  report.intelligence.imdbResearchStatus=imdb.status;
  report.intelligence.indexedImdbExcerptCount=imdb.results.length;
  report.webResearch={status:search.status,queryCount:search.queryCount||0,attemptedQueries:search.attemptedQueries||0,
   sourceCount:search.sourceCount||0,counts:search.counts||{},message:search.message||"No coverage data available."};
  // Name-only matching and snippets cannot establish that a record belongs to the subject.
  return res.status(200).json(report);
}
