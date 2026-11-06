// Identity Lab general public-identity discovery. Read only, no external edits.
// The pilot fetches fixed-source Wikidata and (optionally) a licensed search API.
// Arbitrary supplied websites are NOT fetched, to avoid server-side request forgery.
import {parseIntake,cleanWikidataSearch,cleanSearchResults,reportFromSignals} from "../lib/identity-discovery.mjs";
import {enrichWikidataCandidates,cleanOpenAlexAuthors,buildIdentityGraph} from "../lib/cross-source.mjs";
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
      records=enrichWikidataCandidates(records,info.entities,anchor?.u||null);
    }catch{/* preserve tentative name candidates if identifier lookups fail */}
  }
  return records;
}
async function openalexCandidates(name,records){
  // Identity graph depends on official identifiers; no speculative researcher searches.
  const ids=[...new Set(records.flatMap(r=>r.identifiers?.openalex||[]))].slice(0,3);
  const apiKey=process.env.IDLAB_OPENALEX_API_KEY;
  if(!ids.length)return {results:[],status:"not_linked"};
  if(!apiKey)return {results:[],status:"not_configured"};
  const responses=await Promise.allSettled(ids.map(id=>fetchJson(
    "https://api.openalex.org/authors/"+encodeURIComponent(id),
    {headers:{"Authorization":"Bearer "+apiKey},timeout:4200}
  )));
  const raw=responses.filter(x=>x.status==="fulfilled").map(x=>x.value);
  // OpenAlex single-entity responses have no "results" wrapper.
  return {results:cleanOpenAlexAuthors({results:raw},name),status:raw.length?"ok":"error"};
}
async function searchCandidates(name,anchor){
  const key=process.env.IDLAB_BRAVE_SEARCH_KEY;
  if(!key)return {results:[],status:"not_configured"};
  const query='"'+name.replace(/[\x00-\x1f"\\]/g," ")+'"'+(anchor?" "+anchor.host:"");
  const params=new URLSearchParams({q:query,count:"10",safesearch:"moderate"});
  const data=await fetchJson("https://api.search.brave.com/res/v1/web/search?"+params,{headers:{"X-Subscription-Token":key},timeout:5000});
  return {results:cleanSearchResults(data,name),status:"ok"};
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
  const [wikidata,web]=await Promise.allSettled([wikidataCandidates(input.name,input.anchor),searchCandidates(input.name,input.anchor)]);
  const records=wikidata.status==="fulfilled"?wikidata.value:[];
  const search=web.status==="fulfilled"?web.value:{results:[],status:"error"};
  const scholarly=await openalexCandidates(input.name,records).catch(()=>({results:[],status:"error"}));
  const graph=buildIdentityGraph(records,scholarly.results,input.anchor);
  const report=reportFromSignals({input,wikidata:records,searchResults:search.results,searchStatus:search.status,wikidataStatus:wikidata.status==="fulfilled"?"ok":"error"});
  report.identityGraph=graph;
  report.candidates.openalex=scholarly.results;
  report.coverage.openalex=scholarly.status;
  report.version="0.4.0";
  // Name-only matching and snippets cannot establish that a record belongs to the subject.
  return res.status(200).json(report);
}
