// Ulab universal public-identity graph v1.
// Portable between browser and server. Every profile and factual statement keeps
// its evidence and uncertainty; name matching never proves identity or ownership.
// No network calls, external edits or account credentials.

const text=(v,max=400)=>typeof v==="string"?v.replace(/\s+/g," ").trim().slice(0,max):"";
const normalize=v=>text(v,1300).normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
function https(raw){
 try{
  const u=new URL(raw);
  if(u.protocol!=="https:"||u.username||u.password||u.port)return "";
  u.hash="";return u.href.slice(0,1800);
 }catch{return "";}
}
const urlKey=u=>{try{const x=new URL(https(u));return x.hostname.replace(/^www\./,"").toLowerCase()+decodeURIComponent(x.pathname).replace(/\/+$/,"").toLowerCase();}catch{return "";}};
const isSame=(a,b)=>!!urlKey(a)&&urlKey(a)===urlKey(b);
const stableId=(kind,key)=>kind+":"+key;
const unique=(items)=>[...new Set(items)];
const ordered=(a,b)=>a.id.localeCompare(b.id);
const allowedStatus=new Set(["ok","partial","error","unknown","not_configured"]);
const sourceTypes=["official_anchor","site_sameas","linked_identifier","contextual_candidate","unverified_name_match","indexed_source"];
const stateRank=Object.fromEntries(sourceTypes.map((s,i)=>[s,i]));
function matchStatus(source){
 switch(source){
  case "official_anchor":return "supplied_not_verified";
  case "site_sameas":return "first_party_link_requires_confirmation";
  case "linked_identifier":return "crosslinked_candidate";
  case "contextual_candidate":return "context_candidate";
  default:return "unverified_candidate";
 }
}
function host(u){try{return new URL(https(u)).hostname.replace(/^www\./,"").toLowerCase();}catch{return "";}}

/**
 * @param {{personId:string,name:string,link?:string|null,discovery:object}} params
 * @returns {object} JSON-serializable, bounded graph snapshot
 */
export function buildIdentityGraph({personId,name,link=null,discovery}){
 if(!/^[a-z0-9][a-z0-9-]{1,89}$/.test(personId||""))throw new Error("Invalid graph subject key.");
 const personName=text(name,120);
 if(personName.length<2)throw new Error("Missing subject name.");
 if(!discovery||typeof discovery!=="object"||normalize(discovery.subject?.name)!==normalize(personName))
  throw new Error("The discovery report belongs to a different subject.");
 const anchor=https(link||discovery.subject?.link||"");
 const time=Number.isFinite(Date.parse(discovery.generatedAt))?new Date(discovery.generatedAt).toISOString():new Date().toISOString();
 const researchStatus=allowedStatus.has(discovery.webResearch?.status)?discovery.webResearch.status:
  allowedStatus.has(discovery.coverage?.webSearch)?discovery.coverage.webSearch:"unknown";
 const sourceMap=new Map(),claimMap=new Map(),edgeMap=new Map(),repairMap=new Map();
 const root=stableId("person",personId);
 function addSource(url,{type="indexed_source",title="",excerpt="",reason="",crosslinkedFrom=""}={}){
  const safe=https(url);if(!safe)return null;
  const key=urlKey(safe);if(!key)return null;
  const id=stableId("source",key),prev=sourceMap.get(id);
  const proposedType=sourceTypes.includes(type)?type:"indexed_source";
  const activeType=prev&&stateRank[prev.type]<stateRank[proposedType]?prev.type:proposedType;
  const oldReasons=prev?.reasons||[];
  const node={id,type:activeType,url:safe,host:host(safe),title:text(title,170)||prev?.title||host(safe),
   excerpt:text(excerpt,430)||prev?.excerpt||"",
   state:matchStatus(activeType),
   reasons:unique([...oldReasons,text(reason,170)].filter(Boolean)).slice(0,6),
   crosslinkedFrom:unique([...(prev?.crosslinkedFrom||[]),https(crosslinkedFrom)].filter(Boolean)).slice(0,6),
   ownershipVerified:false,identityConfirmed:false,canEdit:false};
  sourceMap.set(id,node);
  return id;
 }
 function addEdge(from,to,kind,sourceUrl="",certainty="unverified"){
  if(!from||!to)return;
  const key=[from,to,kind].join("|");
  if(edgeMap.has(key))return;
  edgeMap.set(key,{id:stableId("edge",key),from,to,kind,sourceUrl:https(sourceUrl)||null,certainty,
   verifiedByPerson:false});
 }
 function addClaim({predicate,value,sourceUrl,extraction,actor="ulab_system"}={}){
  const p=text(predicate,80),v=text(value,500),u=https(sourceUrl);
  if(!/^[a-z_]{3,80}$/.test(p)||!v||!u)return;
  const id=stableId("claim",[p,urlKey(u),normalize(v)].join("|"));
  claimMap.set(id,{id,predicate:p,value:v,sourceUrl:u,extraction:text(extraction,50)||"page_observation",
   state:"observed_not_truth_verified",actor,observedAt:time,verifiedByPerson:false});
  const sid=addSource(u,{type:"indexed_source"});
  addEdge(root,id,"has_observed_claim",u,"observed");
  addEdge(id,sid,"supported_by_source",u,"source_recorded");
 }
 function addRepair(repair){
  const platform=text(repair?.platform,40),source=https(repair?.recordUrl||repair?.source);
  const current=text(repair?.currentStatement||repair?.observed,500);
  const conflicting=text(repair?.conflictingStatement||repair?.suggestedAction,500);
  if(!source||!current||!conflicting)return;
  const key=stableId("repair",urlKey(source)+"|"+normalize(current).slice(0,100));
  repairMap.set(key,{
   id:key,platform:platform||"website",recordUrl:source,
   currentStatement:current,conflictingStatement:conflicting,
   proposedAction:text(repair?.proposedAction||repair?.suggestedAction,500),
   state:"research_candidate_requires_review",evidence:(Array.isArray(repair?.evidence)?repair.evidence:[])
    .map(e=>({url:https(e?.url),excerpt:text(e?.excerpt,420)})).filter(x=>x.url).slice(0,6),
   ownerAuthorized:false,sourceOwnershipVerified:false,
   adapterAvailable:false,submitted:false,liveChangeVerified:false,actor:"ulab_system"
  });
 }
 if(anchor){
  const sid=addSource(anchor,{type:"official_anchor",title:personName+" — supplied link",reason:"Supplied starting URL, not proof of ownership"});
  addEdge(root,sid,"supplied_identity_anchor",anchor,"supplied_not_verified");
 }
 const site=discovery.site;
 const inspected=!!(site?.parsed&&site?.url&&anchor&&host(site.url)===host(anchor));
 if(inspected){
  const siteId=addSource(site.url,{type:"official_anchor",title:site.parsed.title||"Inspected website",reason:"The supplied website was inspected; ownership not established"});
  addEdge(root,siteId,"inspected_public_website",site.url,"public_html_observed");
  for(const linked of (Array.isArray(site.parsed.sameAs)?site.parsed.sameAs:[]).slice(0,25)){
   const src=addSource(linked,{type:"site_sameas",reason:"Person.sameAs on inspected starting website",crosslinkedFrom:site.url});
   addEdge(siteId,src,"publishes_sameas",site.url,"public_html_observed");
   addEdge(root,src,"candidate_identity_link",site.url,"website_crosslink_unconfirmed");
  }
  for(const person of (Array.isArray(site.parsed.people)?site.parsed.people:[]).slice(0,6)){
   if(normalize(person.name)===normalize(personName)){
    addClaim({predicate:"person_name_markup",value:person.name,sourceUrl:site.url,extraction:"public_jsonld"});
    if(person.description)addClaim({predicate:"professional_description",value:person.description,sourceUrl:site.url,extraction:"public_jsonld"});
   }
  }
  if(site.parsed.title)addClaim({predicate:"website_title",value:site.parsed.title,sourceUrl:site.url,extraction:"public_html_title"});
  if(site.parsed.heading)addClaim({predicate:"website_heading",value:site.parsed.heading,sourceUrl:site.url,extraction:"public_html_heading"});
 }
 const intelligence=discovery.intelligence||{};
 const clusters=intelligence.graph||{};
 for(const item of (Array.isArray(clusters.linked)?clusters.linked:[]).slice(0,22)){
  const type=item.match==="linked_identifier"?"linked_identifier":"site_sameas";
  const id=addSource(item.url,{type,title:item.title,excerpt:item.description,
    reason:item.signals?.join("; ")||"Linked identity candidate",crosslinkedFrom:anchor});
  addEdge(root,id,"candidate_identity_link",anchor,type);
 }
 for(const item of (Array.isArray(clusters.contextual)?clusters.contextual:[]).slice(0,20)){
  const id=addSource(item.url,{type:"contextual_candidate",title:item.title,excerpt:item.description,
   reason:item.signals?.join("; ")||"Professional context overlaps"});
  addEdge(root,id,"contextual_match",item.url,"unverified_context");
 }
 for(const item of (Array.isArray(clusters.ambiguous)?clusters.ambiguous:[]).slice(0,35)){
  const id=addSource(item.url,{type:"unverified_name_match",title:item.title,excerpt:item.description,
   reason:"Potential namesake or name-only match"});
  addEdge(root,id,"possible_namesake",item.url,"unverified_name_only");
 }
 for(const item of (Array.isArray(discovery.candidates?.web)?discovery.candidates.web:[]).slice(0,35)){
  const id=addSource(item.url,{type:"unverified_name_match",title:item.title,excerpt:item.description,
    reason:"Indexed search candidate. Confirm identity before connecting."});
  addEdge(root,id,"search_candidate",item.url,"unverified_name_only");
 }
 for(const item of (Array.isArray(discovery.candidates?.wikidata)?discovery.candidates.wikidata:[]).slice(0,8)){
  const linked=item.match==="identifier_linked";
  const id=addSource(item.url,{type:linked?"linked_identifier":"unverified_name_match",title:item.label,
    excerpt:item.description,reason:linked?"Matching Wikidata identifier":"Wikidata name candidate only"});
  addEdge(root,id,linked?"candidate_identifier_match":"search_candidate",item.url,linked?"crosslinked_candidate":"unverified_name_only");
 }
 for(const item of (Array.isArray(discovery.evidence)?discovery.evidence:[]).slice(0,35)){
  const id=addSource(item.url,{type:"indexed_source",title:item.label,reason:"Source lead in discovery report"});
  addEdge(root,id,"observed_source_lead",item.url,"unverified_lead");
 }
 for(const discrepancy of (Array.isArray(intelligence.discrepancies)?intelligence.discrepancies:[]).slice(0,8)){
  addRepair(discrepancy);
  const url=https(discrepancy.recordUrl);
  if(url){
   addClaim({predicate:"disputed_biography_statement",value:discrepancy.currentStatement,sourceUrl:url,extraction:"indexed_excerpt"});
   addClaim({predicate:"conflicting_credit_statement",value:discrepancy.conflictingStatement,sourceUrl:url,extraction:"indexed_excerpt"});
  }
 }
 for(const item of (Array.isArray(discovery.results)?discovery.results:[]).slice(0,30)){
  if(item.status!=="action"||!item.url||!item.recommendation)continue;
  if(!inspected||host(item.url)!==host(anchor))continue;
  if(!["site_name","site_linked_profiles","indexing","site_title"].includes(item.id))continue;
  addRepair({platform:"website",recordUrl:item.url,currentStatement:item.detail,suggestedAction:item.recommendation});
 }
 const sourceNodes=[...sourceMap.values()].sort(ordered).slice(0,70);
 const validSourceIds=new Set(sourceNodes.map(n=>n.id));
 const claims=[...claimMap.values()].filter(c=>validSourceIds.has(stableId("source",urlKey(c.sourceUrl)))).sort(ordered).slice(0,40);
 const claimIds=new Set(claims.map(c=>c.id));
 const edges=[...edgeMap.values()].filter(x=>
  (x.from===root||validSourceIds.has(x.from)||claimIds.has(x.from))&&
  (x.to===root||validSourceIds.has(x.to)||claimIds.has(x.to))
 ).sort(ordered).slice(0,160);
 const repairs=[...repairMap.values()].sort(ordered).slice(0,14);
 return {
  schemaVersion:1,subject:{id:personId,name:personName,anchorUrl:anchor||null},
  generatedAt:time,source:"ulab_discovery_identity_graph",research:{
   status:researchStatus,siteInspected:inspected,
   coverageDescription:discovery.webResearch?.message||"Coverage depends on search provider and supplied identity anchor.",
   externalEditsMade:false
  },nodes:[{id:root,type:"person",name:personName,verifiedByPerson:false},...sourceNodes],
  edges,claims,repairs,
  overview:{sourceCount:sourceNodes.length,linkedCandidates:sourceNodes.filter(n=>["site_sameas","linked_identifier"].includes(n.type)).length,
   contextualCandidates:sourceNodes.filter(n=>n.type==="contextual_candidate").length,
   unverifiedCandidates:sourceNodes.filter(n=>["unverified_name_match","indexed_source"].includes(n.type)).length,
   observedClaims:claims.length,correctionCandidates:repairs.length,
   submittedCorrections:0,verifiedCorrections:0},
  actionPolicy:"Read-only mapping. No discovered URL is treated as an authorized editing target. Owner-approved edits require separate scoped permission and verification."
 };
}
function graphCheck(graph){
 if(!graph||graph.schemaVersion!==1||typeof graph.subject?.id!=="string"||!Array.isArray(graph.nodes))
  throw new Error("Invalid Ulab identity graph.");
}
export function compareIdentityGraphs(previous,current){
 graphCheck(current);
 if(!previous)return {version:1,baseline:true,subjectId:current.subject.id,
  since:null,checkedAt:current.generatedAt,changes:[],reviewCount:0,
  status:"baseline_created",note:"First observation recorded. No change is inferred."};
 graphCheck(previous);
 if(previous.subject.id!==current.subject.id)throw new Error("Cannot compare different people.");
 const oldNodes=new Map(previous.nodes.filter(n=>n.type!=="person").map(n=>[n.id,n]));
 const currentNodes=new Map(current.nodes.filter(n=>n.type!=="person").map(n=>[n.id,n]));
 const changes=[];
 for(const [id,n] of currentNodes){
  const prior=oldNodes.get(id);
  if(!prior)changes.push({kind:"new_search_source",url:n.url,label:n.title,
   status:"requires_identity_review",message:"New source detected in this bounded research run."});
  else if(prior.type!==n.type)changes.push({kind:"source_classification_changed",url:n.url,label:n.title,
   status:"requires_identity_review",message:"Source evidence class changed: "+prior.type+" to "+n.type+"."});
 }
 if(["ok","partial"].includes(current.research.status)){
  for(const [id,n] of oldNodes){
   if(!currentNodes.has(id))changes.push({kind:"not_in_latest_scan",url:n.url,label:n.title,
    status:"recheck_needed",message:"Not returned by this scan. This does not establish deletion or a broken link."});
  }
 }
 const oldClaims=new Map(previous.claims.map(c=>[c.id,c]));
 for(const c of current.claims){
  if(!oldClaims.has(c.id)){
   const sameField=previous.claims.find(x=>x.predicate===c.predicate&&isSame(x.sourceUrl,c.sourceUrl));
   if(sameField&&normalize(sameField.value)!==normalize(c.value)){
    changes.push({kind:"observed_claim_text_changed",url:c.sourceUrl,label:c.predicate,
     status:"live_fact_check_needed",before:sameField.value,after:c.value,
     message:"Observed source text changed, not yet established as a factual change."});
   }else changes.push({kind:"new_observed_claim",url:c.sourceUrl,label:c.predicate,
    status:"fact_review_needed",message:"New source-backed claim appeared in this scan."});
  }
 }
 const oldRepairs=new Set((previous.repairs||[]).map(x=>x.id));
 for(const r of current.repairs||[])if(!oldRepairs.has(r.id))changes.push({
  kind:"new_correction_candidate",url:r.recordUrl,label:r.platform,
  status:"requires_approval",message:"A new possible discrepancy needs factual review and authorized access."});
 const capped=changes.slice(0,60);
 return {version:1,baseline:false,subjectId:current.subject.id,since:previous.generatedAt,
  checkedAt:current.generatedAt,status:"comparison_complete",
  changes:capped,reviewCount:capped.length,
  coverageWarning:current.research.status==="partial"||previous.research.status==="partial"?
   "At least one scan was partial. Source differences may be search-provider artifacts.":null,
  note:"Observed changes are signals for review, not verified corrections, publication changes or Google Knowledge Panel events."};
}
export function graphPortfolio(graphs){
 const records=Array.isArray(graphs)?graphs.filter(Boolean):[];
 for(const g of records)graphCheck(g);
 return {
  subjects:records.length,sources:records.reduce((a,g)=>a+g.overview.sourceCount,0),
  evidenceClaims:records.reduce((a,g)=>a+g.overview.observedClaims,0),
  correctionCandidates:records.reduce((a,g)=>a+g.overview.correctionCandidates,0),
  verifiedCorrections:records.reduce((a,g)=>a+g.overview.verifiedCorrections,0)
 };
}
