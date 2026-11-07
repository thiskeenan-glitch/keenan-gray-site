// Ulab identity intelligence v1: conservative profile matching and factual-claim comparison.
// Search engine excerpts are *leads*, never proof of ownership, an accepted edit or a live correction.
// No scraping, login, edits or third-party writes.

const clean=(s,max=320)=>String(s??"").replace(/<[^>]*>/g," ").replace(/\s+/g," ").trim().slice(0,max);
const lower=s=>clean(s,800).normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const tokens=s=>lower(s).split(/[^a-z0-9]+/).filter(w=>w.length>=4);
const stop=new Set(["home","official","contact","portfolio","website","welcome","latest","recent","with","this","from","their","known","work","press","photography","services","profile","professional","business","based","about","awards","feature","person","new","more","www","com"]);
function safeUrl(raw){
 try{
  const u=new URL(String(raw));if(u.protocol!=="https:"||u.username||u.password||u.port)return "";
  return u.href;
 }catch{return "";}
}
const normUrl=raw=>{
 try{
  const u=new URL(safeUrl(raw));
  return (u.hostname.replace(/^www\./,"").toLowerCase()+u.pathname.replace(/\/+$/,"").toLowerCase()).replace(/\/$/,"");
 }catch{return "";}
};
function hostname(url){try{return new URL(safeUrl(url)).hostname.replace(/^www\./,"").toLowerCase();}catch{return "";}}
function equivalent(a,b){return !!normUrl(a)&&normUrl(a)===normUrl(b);}
function imdbId(url){
 try{
  const u=new URL(safeUrl(url));
  if(u.hostname!=="imdb.com"&&u.hostname!=="www.imdb.com")return "";
  const match=u.pathname.match(/^\/name\/(nm[0-9]+)(?:\/|$)/);
  return match?.[1]||"";
 }catch{return "";}
}
function sourceMatch(item,name){
 const norm=lower(clean(item?.title,180)+" "+clean(item?.description,500));
 return !!lower(name)&&norm.includes(lower(name));
}
export function identityMatches({name,link=null,site=null,web=[],wikidata=[]}={}){
 const anchor=safeUrl(link);
 // The site must have been successfully fetched and the hostname must match the supplied anchor.
 const ownedSite=!!site?.ok&&!!site?.parsed&&!!anchor&&
  hostname(site.url)===hostname(anchor);
 const verifiedSiteLinks=ownedSite?(site.parsed.sameAs||[]).map(safeUrl).filter(Boolean):[];
 const strongLinks=new Set([anchor,...verifiedSiteLinks].filter(Boolean).map(normUrl));
 const contextRaw=ownedSite?[site.parsed.title,site.parsed.heading,...(site.parsed.people||[]).map(p=>p.description)]:[];
 const context=[...new Set(tokens(contextRaw.join(" ")).filter(w=>!stop.has(w)&&!tokens(name).includes(w)))].slice(0,12);
 const classified=(Array.isArray(web)?web:[]).filter(x=>safeUrl(x.url)).slice(0,45).map(item=>{
  const url=safeUrl(item.url),text=clean(item.title+" "+item.description,700),fromSite=strongLinks.has(normUrl(url));
  const namePresent=sourceMatch(item,name);
  const common=context.filter(w=>tokens(text).includes(w));
  // Deliberately require an independent signal in addition to name and industry words.
  const siteHostname=hostname(anchor),mentionedHost=siteHostname&&lower(text).includes(siteHostname);
  const directOfficial=!!anchor&&equivalent(anchor,url);
  const matchesImdb=!!imdbId(url)&&[...strongLinks].some(link=>link.startsWith("imdb.com/name/"+imdbId(url)));
  const exactLink=fromSite||directOfficial||matchesImdb;
  const matched=exactLink?"linked_from_anchor":namePresent&&mentionedHost?"strong_context_candidate":
   namePresent&&common.length>=2?"context_candidate":"unverified_name_match";
  const score=exactLink?95:matched==="strong_context_candidate"?74:matched==="context_candidate"?58:20;
  return {url,title:clean(item.title,190),description:clean(item.description,430),
   match:matched,score,signals:exactLink?["Profile appears in supplied-site identity links"]:
    matched==="strong_context_candidate"?["Name plus independent supplied-site reference"]:
    common.length>=2?["Name plus shared professional context: "+common.slice(0,3).join(", ")]:["Name alone is insufficient"],
   requiresConfirmation:!exactLink,source:"indexed_search_excerpt"};
 });
 const metadata=(Array.isArray(wikidata)?wikidata:[]).slice(0,8).map(w=>({
  url:safeUrl(w.url),title:clean(w.label,100),description:clean(w.description,200),
  match:w.match==="identifier_linked"?"linked_identifier":"unverified_name_match",
  score:w.match==="identifier_linked"?90:20,
  signals:w.match==="identifier_linked"?["Official identifier points to the supplied identity"]:["Wikidata name alone is not an identity match"],
  requiresConfirmation:w.match!=="identifier_linked",source:"wikidata_candidate"
 })).filter(x=>x.url);
 const all=[...classified,...metadata];
 const linked=all.filter(x=>["linked_from_anchor","linked_identifier"].includes(x.match));
 const contextual=all.filter(x=>["strong_context_candidate","context_candidate"].includes(x.match));
 const ambiguous=all.filter(x=>x.requiresConfirmation&&x.score<50);
 return {
  version:1,anchor:anchor||null,verifiedSiteInspection:ownedSite,
  linkedProfileUrls:[...new Set(verifiedSiteLinks)],
  contextTerms:context,
  linked:linked.slice(0,18),contextual:contextual.slice(0,15),ambiguous:ambiguous.slice(0,25),
  counts:{linked:linked.length,contextual:contextual.length,ambiguous:ambiguous.length},
  disclaimer:"Linked identity evidence still requires participant confirmation. Search excerpts are candidates, not verified facts."
 };
}
export function findAnchoredImdb({link=null,site=null}={}){
 const anchor=safeUrl(link);
 let id=imdbId(anchor);
 if(id)return {id,url:"https://www.imdb.com/name/"+id+"/",reason:"supplied_profile"};
 const siteGood=!!site?.ok&&!!site?.parsed&&!!anchor&&hostname(site.url)===hostname(anchor);
 if(!siteGood)return null;
 const links=site.parsed.sameAs||[];
 const ids=[...new Set(links.map(imdbId).filter(Boolean))];
 if(ids.length!==1)return null;
 id=ids[0];
 return {id,url:"https://www.imdb.com/name/"+id+"/",reason:"first_party_person_same_as"};
}
export function imdbResearchQueries(name,id){
 if(!/^nm[0-9]+$/.test(id)||clean(name,120).length<2)return [];
 const quote='"'+clean(name,100).replace(/"/g,"")+'"';
 return [
  "site:imdb.com/name/"+id+"/ "+quote+' "most recent short film"',
  "site:imdb.com/name/"+id+"/ "+quote+' "Director" "Short"'
 ];
}
function imdbProfileResult(item,id,name){
 if(!item||imdbId(item.url)!==id)return false;
 const title=clean(item.title,240),desc=clean(item.description,600);
 return lower(title+" "+desc).includes(lower(name));
}
function bioLatestFilm(text){
 // A narrowly defined statement, not a generic "latest work" guess.
 const t=clean(text,900);
 const m=t.match(/\b(?:his|her|their)\s+(?:most\s+recent|latest)\s+short\s+film[,:]?\s*["“']?([A-Z][A-Za-z0-9'-]*(?:\s+[A-Za-z0-9'-]+){0,4})(?=\s*[,.;]|["”']|\s+(?:was|is|has|which|that)\b)/i);
 return m?clean(m[1],100).replace(/[.,;]$/,""):"";
}
function credits(text){
 // IMDb excerpts commonly show "Toy Gun (2026) Short ... director".
 const src=clean(text,1800),items=[];
 const re=/\b([A-Z][a-zA-Z0-9'’-]*(?:\s+[A-Z][a-zA-Z0-9'’-]*){0,5})\s*\((20[0-9]{2})\)/g;
 for(const m of src.matchAll(re)){
  const title=clean(m[1],90),year=Number(m[2]);
  if(title.length<3||year<2000||year>2100)continue;
  // The role must be shown near the title, rather than inferred from the person's overall profession.
  const tail=src.slice(m.index+m[0].length,m.index+m[0].length+110);
  // Never borrow a director role from the *next* film entry in a compact snippet.
  const nextCredit=tail.search(/\b[A-Z][A-Za-z0-9'’-]*(?:\s+[A-Z][A-Za-z0-9'’-]*){0,5}\s*\(20[0-9]{2}\)/);
  const nearby=nextCredit>=0?tail.slice(0,nextCredit):tail;
  if(!/\b(?:director|directed)\b/i.test(nearby))continue;
  items.push({title,year});
 }
 return items;
}
export function detectImdbBiographyDiscrepancy({name,profile,results=[],checkedAt=new Date().toISOString()}={}){
 if(!profile?.id||!imdbId(profile.url)||imdbId(profile.url)!==profile.id)return [];
 const source=(Array.isArray(results)?results:[])
  .filter(x=>imdbProfileResult(x,profile.id,name)).slice(0,30);
 const bioSource=source.map(x=>({source:x,title:bioLatestFilm(clean(x.title+" "+x.description,1200))}))
  .find(x=>x.title);
 if(!bioSource)return [];
 const filmed=source.flatMap(x=>credits(clean(x.title+" "+x.description,1800)).map(c=>({...c,evidence:x})));
 const bioCredit=filmed.find(x=>lower(x.title)===lower(bioSource.title));
 const newer=filmed.filter(x=>bioCredit&&x.year>bioCredit.year&&lower(x.title)!==lower(bioSource.title))
  .sort((a,b)=>b.year-a.year)[0];
 if(!newer)return [];
 return [{
  id:"imdb-biography-latest-film-"+profile.id,
  platform:"imdb",
  type:"biography_chronology_review",
  status:"indexed_excerpt_conflict_needs_live_confirmation",
  severity:"meaningful_candidate",
  subject:clean(name,120),recordUrl:profile.url,
  currentStatement:"Biography calls "+bioSource.title+" the most recent short film.",
  conflictingStatement:"The same IMDb name page excerpt lists "+newer.title+" ("+newer.year+") as a directing credit, after "+bioSource.title+" ("+bioCredit.year+").",
  proposedAction:"Confirm the current live biography and release chronology. If the statement is outdated, prepare a sourced third-person biography correction for IMDb's official contribution interface.",
  evidence:[
   {url:bioSource.source.url,kind:"indexed_imdb_bio_excerpt",excerpt:clean(bioSource.source.description,400),title:clean(bioSource.source.title,150)},
   {url:newer.evidence.url,kind:"indexed_imdb_filmography_excerpt",excerpt:clean(newer.evidence.description,400),title:clean(newer.evidence.title,150)}
  ],observedAt:checkedAt,
  nextStep:"Human confirmation of the live record and authorization; IMDb accepts contributions subject to review. No IMDb submission API or approved account connection is configured.",
  execution:{adapter:"imdb_official_contribution",available:false,authorized:false,submitted:false,published:false},
  verification:{method:"recheck_live_imdb_bio_after_submission",status:"not_started"},
  actor:"ulab_system",disclaimer:"Indexed snippets may be stale or incomplete. A later credit does not prove when a film was made or that the bio is factually false."
 }];
}
export function analyzeIdentity({input,site=null,wikidata=[],web=[],imdbSearch=[]}={}){
 const graph=identityMatches({name:input?.name,link:input?.link,site,web,wikidata});
 const profile=findAnchoredImdb({link:input?.link,site});
 const evidence=[...web,...imdbSearch];
 const discrepancies=profile?detectImdbBiographyDiscrepancy({
  name:input.name,profile,results:evidence
 }):[];
 return {version:1,graph,discrepancies,investigatedProfile:profile||null,
  investigationStatus:profile?imdbSearch.length?"indexed_excerpts_reviewed":"no_indexed_profile_excerpts":"no_anchored_imdb_profile",
  actionPolicy:"All inferred facts require review. No external edits or IMDb submissions were made."};
}
