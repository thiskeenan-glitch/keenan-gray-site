// Identity Lab general public-identity discovery. Read only, no external edits.
// The pilot fetches fixed-source Wikidata and (optionally) a licensed search API.
// Arbitrary supplied websites are NOT fetched, to avoid server-side request forgery.
import {parseIntake,cleanWikidataSearch,identifyWikidataAnchors,cleanSearchResults,reportFromSignals} from "../lib/identity-discovery.mjs";
import {inspectPublicHomepage} from "../lib/safe-site-inspection.mjs";
import {researchQueries,organizeWebResults,normalizeBraveResponse,visibilityQueries,sampledVisibility} from "../lib/web-research.mjs";
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
  message:"Indexed-web search is not connected to this pilot. This scan cannot discover your full professional footprint.",findability:{score:null,checked:0,appeared:0,rows:[],source:"Brave Search API",notGoogle:true}};
 const discovery=researchQueries(input,site);
 const visibility=visibilityQueries(input,site);
 const queries=[...new Set([...discovery,...visibility.map(x=>x.query)])].slice(0,8);
 const completed=await Promise.allSettled(queries.map(async q=>{
  const params=new URLSearchParams({q,count:"20",safesearch:"moderate",text_decorations:"false",result_filter:"web"});
  const data=await fetchJson("https://api.search.brave.com/res/v1/web/search?"+params,{
   headers:{"X-Subscription-Token":key},timeout:5700});
  return {query:q,results:normalizeBraveResponse(data)};
 }));
 const all=queries.map((q,i)=>completed[i].status==="fulfilled"?completed[i].value:{query:q,results:[],status:"error"});
 const successful=all.filter((x,i)=>completed[i].status==="fulfilled");
 const visibilityRows=visibility.map(probe=>{
  const index=queries.indexOf(probe.query);
  const entry=all[index];
  return {...probe,results:entry?.results||[],status:index>=0&&completed[index].status==="fulfilled"?"ok":"error"};
 });
 const research=organizeWebResults(successful,{name:input.name,link:input.link,site});
 const findability=sampledVisibility(visibilityRows,{name:input.name,link:input.link});
 return {results:research.results,status:!successful.length?"error":successful.length<queries.length?"partial":"ok",
  queryCount:successful.length,attemptedQueries:queries.length,findability,rawCount:research.rawCount,
  sourceCount:research.retainedCount,counts:research.counts,
  message:successful.length?"Web results are public leads, not independently verified identity matches.":"The external search provider did not return results."};
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
  report.webResearch={status:search.status,queryCount:search.queryCount||0,attemptedQueries:search.attemptedQueries||0,
   sourceCount:search.sourceCount||0,counts:search.counts||{},findability:search.findability||{score:null,checked:0,appeared:0,rows:[],source:"Brave Search API",notGoogle:true},message:search.message||"No coverage data available."};
  // Name-only matching and snippets cannot establish that a record belongs to the subject.
  return res.status(200).json(report);
}
