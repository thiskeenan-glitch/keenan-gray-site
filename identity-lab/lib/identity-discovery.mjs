// Identity Lab: profession-neutral identity discovery and evidence labeling.
// Pure functions. A candidate is never assumed to be the right person.
import {isIP} from "node:net";
const limited=(value,max=300)=>typeof value==="string"?value.trim().slice(0,max):"";
const normalizeName=s=>limited(s,120).normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ").toLowerCase();
const badHosts=new Set(["localhost","metadata.google.internal","host.docker.internal"]);
const blockedSuffixes=[".local",".localhost",".internal",".test",".example",".invalid",".onion",".arpa",".lan",".home",".corp"];
export function safePublicUrl(value){
  const raw=limited(value,1500);let u;
  try{u=new URL(raw);}catch{throw new Error("Enter a complete HTTPS link, such as https://example.com.");}
  const host=u.hostname.toLowerCase();
  if(u.protocol!=="https:"||u.port||u.username||u.password||!host.includes(".")||host.endsWith(".")||badHosts.has(host)||blockedSuffixes.some(x=>host.endsWith(x))||isIP(host)||/[^a-z0-9.-]/.test(host)||host.split(".").some(x=>!x||x.startsWith("-")||x.endsWith("-")))
    throw new Error("Use a public HTTPS website or professional profile link.");
  if(u.href.length>1500)throw new Error("Link is too long.");
  u.hash="";return u.href;
}
export function classifyLink(value){
  const u=new URL(safePublicUrl(value));
  const host=u.hostname.replace(/^www\./,"").toLowerCase();
  const profiles=new Map([
    ["linkedin.com","LinkedIn"],["imdb.com","IMDb"],["themoviedb.org","TMDb"],
    ["wikipedia.org","Wikipedia"],["wikidata.org","Wikidata"],["instagram.com","Instagram"],
    ["facebook.com","Facebook"],["x.com","X"],["twitter.com","X"],["youtube.com","YouTube"],
    ["tiktok.com","TikTok"],["github.com","GitHub"],["behance.net","Behance"],
    ["vimeo.com","Vimeo"],["medium.com","Medium"],["substack.com","Substack"],
    ["goodreads.com","Goodreads"],["spotify.com","Spotify"],["musicbrainz.org","MusicBrainz"]
  ]);
  for(const [root,label] of profiles){
    if(host===root||host.endsWith("."+root))return {kind:"profile",label,host,u:u.href};
  }
  return {kind:"website",label:"Supplied website",host,u:u.href};
}
export function parseIntake(data){
  const name=limited(data?.name,120).replace(/\s+/g," ");
  if(name.length<2||name.length>100)throw new Error("Enter a professional name between 2 and 100 characters.");
  const link=limited(data?.link||data?.website||data?.imdb,1500);
  return {name,link:link?safePublicUrl(link):null,anchor:link?classifyLink(link):null};
}
function status(results,status){return results.filter(x=>x.status===status).length;}
function finding(id,title,status,detail,url=null,recommendation=null){
  return {id,title,status,detail,url,category:"Identity",recommendation};
}
function usableLink(value){
  try{return safePublicUrl(value);}catch{return null;}
}
function exactUrlMatch(a,b){
  if(!a||!b)return false;
  try{const x=new URL(a),y=new URL(b);
    return x.hostname.replace(/^www\./,"")===y.hostname.replace(/^www\./,"")&&x.pathname.replace(/\/$/,"").toLowerCase()===y.pathname.replace(/\/$/,"").toLowerCase();
  }catch{return false;}
}
export function cleanWikidataSearch(data,name){
  return (Array.isArray(data?.search)?data.search:[]).filter(x=>/^Q[1-9][0-9]*$/.test(x.id||"")&&normalizeName(x.label)===normalizeName(name))
    .slice(0,5).map(x=>({id:x.id,label:limited(x.label,100),description:limited(x.description,200),url:"https://www.wikidata.org/wiki/"+x.id,match:"name_only",status:"unverified"}));
}
export function identifyWikidataAnchors(candidates,entities,link){
  if(!link||!entities||typeof entities!=="object")return candidates;
  let u;try{u=new URL(link);}catch{return candidates;}
  return candidates.map(c=>{
    const claims=entities[c.id]?.claims||{};
    const values=id=>(claims[id]||[]).map(x=>x?.mainsnak?.datavalue?.value).filter(v=>typeof v==="string");
    let match=false;
    if(u.hostname.replace(/^www\./,"")==="imdb.com"&&/^\/name\/nm[0-9]+\/?$/.test(u.pathname)){
      match=values("P345").some(x=>x===u.pathname.match(/nm[0-9]+/)[0]);
    }else if(!["linkedin.com","www.linkedin.com"].includes(u.hostname)){
      match=values("P856").some(x=>{try{return new URL(x).hostname.replace(/^www\./,"")===u.hostname.replace(/^www\./,"");}catch{return false;}});
    }
    const officialWebsites=values("P856").filter(value=>{try{const u=new URL(value);return u.protocol==="https:"&&!u.username&&!u.password&&!u.port;}catch{return false;}}).slice(0,5);
    return {...c,match:match?"identifier_linked":"name_only",status:match?"cross_linked":"unverified",officialWebsites};
  });
}
export function cleanSearchResults(data,name){
  const seen=new Set(),found=[];
  for(const item of (data?.web?.results||[]).slice(0,12)){
    const url=usableLink(item.url||"");
    if(!url||seen.has(url))continue;
    const title=limited(item.title,150),description=limited(item.description,320);
    if(!normalizeName(title+" "+description).includes(normalizeName(name)))continue;
    seen.add(url);
    found.push({url,title,description,match:"search_candidate",status:"unverified"});
    if(found.length>=8)break;
  }
  return found;
}
const personType=x=>(Array.isArray(x)?x:[x]).some(t=>typeof t==="string"&&/^(Person|https?:\/\/schema.org\/Person)$/i.test(t));
function parseAttr(raw,name){
  const escaped=name.replace(/[-/\\^$*+?.()|[\]{}]/g,"\\$&");
  const re=new RegExp("(?:^|\\s)"+escaped+"\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s>]+))","i");
  const m=raw.match(re);return m?(m[1]||m[2]||m[3]||""):"";
}
function decode(s){
  return String(s||"").replace(/&amp;/gi,"&").replace(/&quot;/gi,'"').replace(/&#39;|&#x27;/gi,"'").replace(/&lt;/gi,"<").replace(/&gt;/gi,">").replace(/\s+/g," ").trim();
}
function textOnly(s){return decode(String(s||"").replace(/<[^>]*>/g," "));}
export function extractSite(html,pageUrl){
  const jsonld=[];
  const scripts=/<script\b([^>]*?)>([\s\S]*?)<\/script\s*>/gi;
  for(const match of html.matchAll(scripts)){
    if(parseAttr(match[1],"type").toLowerCase()!=="application/ld+json")continue;
    try{const val=JSON.parse(match[2]),roots=Array.isArray(val)?val:[val];
      for(const root of roots){if(!root||typeof root!=="object")continue;
        jsonld.push(...(Array.isArray(root["@graph"])?root["@graph"]:[root]));}
    }catch{}
  }
  const people=jsonld.filter(x=>x&&typeof x==="object"&&personType(x["@type"]));
  const sameAs=people.flatMap(x=>Array.isArray(x.sameAs)?x.sameAs:x.sameAs?[x.sameAs]:[])
    .map(x=>typeof x==="string"?usableLink(x):null).filter(Boolean).slice(0,30);
  const links=[];
  const re=/<a\b([^>]*?)>/gi;
  for(const match of html.matchAll(re)){
    const href=parseAttr(match[1],"href");try{
      const resolved=new URL(href,pageUrl).href;
      const safe=usableLink(resolved);
      if(safe&&new URL(safe).hostname!==new URL(pageUrl).hostname)links.push(safe);
    }catch{}
    if(links.length>60)break;
  }
  const heading=textOnly((html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)||[])[1]);
  const title=textOnly((html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)||[])[1]);
  let noindex=false;
  for(const m of html.matchAll(/<meta\b([^>]*?)>/gi)){
    if(["robots","googlebot"].includes(parseAttr(m[1],"name").toLowerCase())&&/\bnoindex\b/i.test(parseAttr(m[1],"content")))noindex=true;
  }
  return {title:limited(title,200),heading:limited(heading,200),people:people.slice(0,8).map(p=>({name:limited(p.name,120),description:limited(p.description,250)})),sameAs:[...new Set(sameAs)],outlinks:[...new Set(links)].slice(0,30),noindex};
}
export function reportFromSignals({input,site=null,wikidata=[],searchResults=[],searchStatus="not_configured",wikidataStatus="not_checked"}){
  const {name,link,anchor}=input;
  const results=[],evidence=[];
  if(link)evidence.push({url:link,label:anchor.label,relationship:"customer_supplied",certainty:"supplied_not_verified"});
  results.push(finding("anchor",link?"Starting link supplied":"Starting identity link missing",link?"pass":"manual",
    link?"The audit has one starting link. A supplied link is not proof of ownership or that other records belong to this person.":"Name-only audit. Without another identifying link, shared names can match unrelated people.",link,
    link?null:"Add one official website or professional profile to make identity matching more reliable."));
  if(anchor?.kind==="website"){
    const siteSource=site?.url||link;
    if(site?.ok&&site.parsed){
      const page=site.parsed,matching=page.people.filter(x=>normalizeName(x.name)===normalizeName(name));
      if(matching.length)results.push(finding("site_name","Public person markup matches the name","pass","A Person structured-data entry uses the supplied professional name. This is not a claim of identity ownership.",siteSource));
      else if(page.people.length)results.push(finding("site_name","Person markup needs human review","manual","The scanned page has Person markup, but the available name does not exactly match the submitted name.",siteSource,"Review the name and identity on this page before proposing changes."));
      else results.push(finding("site_name","No Person markup found","action","The scanned page has no detectable Person JSON-LD. Adding accurate structured information can clarify who the site represents.",siteSource,"If this is your site, add valid Person structured data using verifiable facts."));
      results.push(finding("site_links","Public identity links on the website",page.sameAs.length?"pass":"manual",
        page.sameAs.length?page.sameAs.length+" sameAs profile link(s) were found in the scanned page. Follow them only after checking they refer to the right person.":"No Person.sameAs links found in this page sample.",siteSource,page.sameAs.length?null:"If you own this site, link to your real public professional profiles."));
      if(page.noindex)results.push(finding("indexing","Page instructs crawlers not to index","action","An HTML robots meta directive contains noindex. Confirm this is intentional.",siteSource,"If this is your public professional site, remove accidental noindex."));
      else results.push(finding("indexing","No obvious noindex meta tag","pass","The scanned page did not contain an HTML noindex meta directive. This does not prove Google indexes it.",siteSource));
      for(const url of page.sameAs.slice(0,12))evidence.push({url,label:classifyLink(url).label,relationship:"site_sameas",certainty:"linked_not_verified"});
      // Site outlinks may include unrelated people; do not promote automatically.
    }else results.push(finding("site","Website scan incomplete","unknown",site?.error||"The supplied website was not scanned. No claims about its content can be made.",siteSource));
  }else if(anchor?.kind==="profile"){
    results.push(finding("profile","Public profile link provided","manual","The link has been accepted as a starting reference. No login, scraping, or modification of the platform was attempted.",link,"Confirm this profile belongs to you and add a second source when available."));
  }
  if(wikidata.length){
    const linked=wikidata.some(x=>x.match==="identifier_linked");
    results.push(finding("wikidata","Possible Wikidata identity records",linked?"pass":"manual",
      linked?"A Wikidata record links to the supplied website or IMDb identifier. Confirm the remaining details before relying on it.":wikidata.length+" exact-name candidate(s) found. Same-name results are not verified matches.",
      wikidata[0].url,linked?null:"Review the candidates and reject records belonging to namesakes."));
    for(const c of wikidata)evidence.push({url:c.url,label:c.label+(c.description?" · "+c.description:""),relationship:c.match,certainty:c.status});
  }else results.push(finding("wikidata","Wikidata identity lookup",wikidataStatus==="ok"?"manual":"unknown",
    wikidataStatus==="ok"?"No exact-name records found among the returned candidates. This does not establish a lack of public recognition.":"Public knowledge-source lookup was unavailable.",null,
    "Use a verified professional link for more accurate cross-site matching."));
  if(searchResults.length){
    results.push(finding("web","Additional public search candidates","manual",
      searchResults.length+" web result(s) mention the name. These may belong to different people and must be verified.",searchResults[0].url,
      "Check whether each publication or profile refers to the same person."));
    for(const item of searchResults)evidence.push({url:item.url,label:item.title,relationship:item.match,certainty:"unverified"});
  }else results.push(finding("web","Open-web source discovery",searchStatus==="not_configured"?"unknown":"manual",
    searchStatus==="not_configured"?"Broad search integration is not connected yet. This report is incomplete, not a claim that no coverage exists.":searchStatus==="ok"?"No suitable name-matching search results were returned. The public web may still contain relevant coverage.":"External search was unavailable on this scan.",null,
    searchStatus==="not_configured"?"Connect an approved search provider for broader coverage.":null));
  results.push(finding("panel","Google Knowledge Panel status","manual",
    "Not independently checked. Google's Knowledge Panels are generated automatically; this audit does not promise eligibility or appearance.",null,
    "Record a dated real Google search result and monitor over time."));
  const uniqueEvidence=[...new Map(evidence.map(x=>[x.url,x])).values()].slice(0,28);
  const summary={pass:status(results,"pass"),action:status(results,"action"),manual:status(results,"manual"),unknown:status(results,"unknown")};
  const priority=results.filter(x=>x.recommendation&&["action","manual","unknown"].includes(x.status)).map(x=>({title:x.title,description:x.recommendation,source:x.url||null})).slice(0,7);
  return {version:"0.2.0",generatedAt:new Date().toISOString(),subject:{name,link,linkType:anchor?.kind||null,linkLabel:anchor?.label||null},summary,results,priority,
    candidates:{wikidata,web:searchResults},evidence:uniqueEvidence,coverage:{wikidata:wikidataStatus,webSearch:searchStatus,website:anchor?.kind==="website"?(site?.ok?"scanned":"unavailable"):"not_requested"},
    site:site?.ok?{url:site.url,parsed:site.parsed}:null,
    disclaimer:"This is a preliminary public-source discovery audit. Name matches and search snippets are candidates, not verified identity claims. No platform edits, panel eligibility checks, or account changes occurred."};
}
