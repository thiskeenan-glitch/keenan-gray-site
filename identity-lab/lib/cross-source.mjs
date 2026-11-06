// Source adapters and cross-source identity graph. Read-only, no external edits.
// A shared identifier links database records, not a guaranteed real-world identity.
const cut=(s,n=180)=>typeof s==="string"?s.trim().slice(0,n):"";
const cleanName=s=>cut(s,140).normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/\s+/g," ").toLowerCase();
const unique=a=>[...new Set(a)];
const officialUrl=raw=>{
 try{const u=new URL(raw);return u.protocol==="https:"&&!u.username&&!u.password&&!u.port?u.href:null;}catch{return null;}
};
const equalHost=(a,b)=>{
 try{return new URL(a).hostname.toLowerCase().replace(/^www\./,"")===new URL(b).hostname.toLowerCase().replace(/^www\./,"");}catch{return false;}
};
const identifierId=(v,re)=>{
 const s=cut(v,200),m=s.match(re);return m?m[1].toUpperCase():null;
};
export function normalizeOpenAlexId(value){
 return identifierId(value,/^(?:https:\/\/openalex\.org\/(?:authors\/)?)?(A[0-9]{4,12})\/?$/i);
}
export function normalizeOrcidId(value){
 const s=cut(value,130).replace(/^https:\/\/orcid\.org\//i,"").toUpperCase();
 if(!/^\d{4}-\d{4}-\d{4}-[\dX]{4}$/.test(s))return null;
 const plain=s.replace(/-/g,"");let total=0;
 for(const ch of plain.slice(0,15))total=(total+Number(ch))*2;
 const digit=(12-total%11)%11;
 if((digit===10?"X":String(digit))!==plain[15])return null;
 return s;
}
function statementValues(entity,prop){
 const claims=entity?.claims?.[prop];
 if(!Array.isArray(claims))return [];
 return unique(claims.filter(x=>x?.rank!=="deprecated").map(x=>x?.mainsnak?.datavalue?.value).filter(x=>typeof x==="string").map(x=>x.trim()).filter(Boolean)).slice(0,8);
}
export function extractWikidataClaims(entity){
 const ids={
  imdb:statementValues(entity,"P345").filter(x=>/^nm[0-9]+$/.test(x)).slice(0,4),
  tmdb:statementValues(entity,"P4985").filter(x=>/^[1-9][0-9]*$/.test(x)).slice(0,4),
  orcid:unique(statementValues(entity,"P496").map(normalizeOrcidId).filter(Boolean)).slice(0,4),
  openalex:unique(statementValues(entity,"P10283").map(normalizeOpenAlexId).filter(x=>x?.startsWith("A"))).slice(0,4)
 };
 const officialWebsites=statementValues(entity,"P856").map(officialUrl).filter(Boolean).slice(0,5);
 const profiles=[];
 const add=(platform,id,url)=>profiles.push({platform,id,url,recordedBy:"wikidata_statement",checkedAtSource:false});
 for(const id of ids.imdb)add("IMDb",id,"https://www.imdb.com/name/"+id+"/");
 for(const id of ids.tmdb)add("TMDb",id,"https://www.themoviedb.org/person/"+id);
 for(const id of ids.orcid)add("ORCID",id,"https://orcid.org/"+id);
 for(const id of ids.openalex)add("OpenAlex",id,"https://openalex.org/"+id);
 return {identifiers:ids,officialWebsites,profiles};
}
function connectedToUser(claims,link,qid){
 if(!link)return false;
 try{
  const u=new URL(link),host=u.hostname.toLowerCase().replace(/^www\./,""),path=u.pathname.replace(/\/$/,"");
  if(host==="wikidata.org")return path==="/wiki/"+qid;
  if(host==="imdb.com"&&/^\/name\/nm[0-9]+$/.test(path))return claims.identifiers.imdb.includes(path.split("/")[2]);
  if(host==="themoviedb.org"&&/^\/person\/[0-9]+(?:-[\w-]+)?$/i.test(path))return claims.identifiers.tmdb.includes(path.match(/^\/person\/([0-9]+)/)[1]);
  if(host==="orcid.org")return claims.identifiers.orcid.includes(normalizeOrcidId(path.slice(1)));
  if(host==="openalex.org")return claims.identifiers.openalex.includes(normalizeOpenAlexId(path.slice(1)));
  if(["linkedin.com","x.com","twitter.com","instagram.com","facebook.com","youtube.com"].includes(host))return false;
  return claims.officialWebsites.some(url=>equalHost(url,link));
 }catch{return false;}
}
export function enrichWikidataCandidates(candidates,entities,link){
 return (Array.isArray(candidates)?candidates:[]).slice(0,5).map(c=>{
  const claims=extractWikidataClaims(entities?.[c.id]);
  const connected=connectedToUser(claims,link,c.id);
  return {...c,...claims,match:connected?"identifier_linked":"name_only",status:connected?"cross_linked":"unverified"};
 });
}
export function cleanOpenAlexAuthors(data,name){
 const results=[],seen=new Set();
 for(const candidate of (Array.isArray(data?.results)?data.results:[]).slice(0,14)){
  const id=normalizeOpenAlexId(candidate?.id);
  if(!id||seen.has(id))continue;
  const label=cut(candidate.display_name,110);
  const variants=Array.isArray(candidate.display_name_alternatives)?candidate.display_name_alternatives:[];
  if(cleanName(label)!==cleanName(name)&&!variants.some(v=>cleanName(v)===cleanName(name)))continue;
  const orcids=unique([candidate.orcid,candidate.ids?.orcid,...(Array.isArray(candidate.observed_orcids)?candidate.observed_orcids:[]),...(Array.isArray(candidate.ids?.observed_orcids)?candidate.ids.observed_orcids:[])]
    .map(normalizeOrcidId).filter(Boolean)).slice(0,6);
  results.push({id,url:"https://openalex.org/"+id,label,orcid:orcids[0]||null,orcids,
    worksCount:Number.isFinite(candidate.works_count)?Math.max(0,Math.floor(candidate.works_count)):null,
    status:"unverified",match:"name_only",source:"openalex_public_api"});
  seen.add(id);
  if(results.length>=6)break;
 }
 return results;
}
export function buildIdentityGraph(wikidata=[],openalex=[],anchor=null){
 const nodes=[],edges=[],comparisons=[],uniqueEdges=new Set(),uniqueComparisons=new Set();
 const connect=(from,to,type,evidence)=>{
  const key=from+"|"+to+"|"+type;if(uniqueEdges.has(key))return;
  uniqueEdges.add(key);edges.push({from,to,type,evidence});
 };
 const compare=(q,o,kind,current,observed,detail)=>{
  const id=q.id+":"+o.id+":"+kind;if(uniqueComparisons.has(id))return;
  uniqueComparisons.add(id);
  comparisons.push({id,kind,subjectQid:q.id,openalexId:o.id,
    subjectUrl:q.url,otherUrl:o.url,current,observed,detail,
    status:"needs_human_review",sourceRelationship:"shared_external_identifier",autoSubmit:false});
 };
 for(const q of wikidata.slice(0,5)){
  nodes.push({key:"wikidata:"+q.id,platform:"Wikidata",url:q.url,label:q.label,sourceStatus:q.status,
    identifiers:q.identifiers||{},profileCount:q.profiles?.length||0});
  for(const profile of (q.profiles||[]).slice(0,18)){
   const key=profile.platform.toLowerCase()+":"+profile.id;
   nodes.push({key,platform:profile.platform,url:profile.url,label:profile.id,sourceStatus:"claimed_by_wikidata_not_checked"});
   connect("wikidata:"+q.id,key,"public_wikidata_identifier",q.url);
  }
 }
 for(const a of openalex.slice(0,6)){
  const key="openalex:"+a.id;
  if(!nodes.some(x=>x.key===key))nodes.push({key,platform:"OpenAlex",url:a.url,label:a.label,sourceStatus:"api_record_unverified_person_match"});
  for(const q of wikidata.slice(0,5)){
   const ids=q.identifiers||{};
   const matchId=(ids.openalex||[]).includes(a.id);
   const matchOrcid=(ids.orcid||[]).some(x=>(a.orcids||[]).includes(x));
   if(!matchId&&!matchOrcid)continue;
   connect("wikidata:"+q.id,key,matchId?"same_openalex_id":"shared_orcid",q.url+" | "+a.url);
   if(matchId&&a.orcid){
    const recorded=ids.orcid||[];
    if(recorded.length===0)compare(q,a,"possible_missing_orcid",
      "Wikidata P496 has no active ORCID value.",a.orcid,
      "An OpenAlex author record explicitly linked by Wikidata P10283 lists an ORCID. Check the real person and the ORCID before changing Wikidata.");
    else if(!recorded.some(x=>(a.orcids||[]).includes(x)))compare(q,a,"possible_orcid_conflict",
      recorded.join(", "),a.orcid,
      "The explicitly ID-linked OpenAlex record and Wikidata have different ORCID identifiers. Could reflect multiple or merged author profiles; verify with an authoritative ORCID source.");
   }
   if(matchOrcid&&!(ids.openalex||[]).includes(a.id)&&!(ids.openalex||[]).length)
    compare(q,a,"possible_missing_openalex_id","Wikidata P10283 has no OpenAlex author identifier.",a.id,
      "Both records share an ORCID identifier, but Wikidata does not list this OpenAlex author ID. Verify the records before proposing a new statement.");
  }
 }
 const graph={version:1,nodes:nodes.slice(0,55),edges:edges.slice(0,55),comparisons:comparisons.slice(0,12),
    limitations:"Wikidata external IDs are claims, not confirmation that the linked platform was inspected. OpenAlex authors can be merged or misassigned. Identity and conflicting facts require review."};
 return graph;
}
