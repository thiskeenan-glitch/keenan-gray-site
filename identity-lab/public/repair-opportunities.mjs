// Public identity observations -> evidence-gated correction-review suggestions.
// No submissions. A self-reported candidate is not independently verified.
const text=(v,n=400)=>String(v??"").trim().slice(0,n);
const isWebsite=report=>report?.subject?.linkType==="website"&&typeof report?.subject?.link==="string";
const wikidataItem=c=>c&&/^Q[1-9][0-9]*$/.test(c.id||"")&&c.url==="https://www.wikidata.org/wiki/"+c.id;
function canonicalDomain(url){try{return new URL(url).hostname.toLowerCase().replace(/^www\./,"");}catch{return null;}}
function safeUrl(v){try{const u=new URL(v);return u.protocol==="https:"&&!u.username&&!u.password&&!u.port&&u.hostname.includes(".")?u.href:null;}catch{return null;}}
export function draftOpportunities(report,{reviews={}}={}){
 const website=isWebsite(report)?safeUrl(report.subject.link):null;
 const candidates=Array.isArray(report.candidates?.wikidata)?report.candidates.wikidata:[];
 const items=[];
 for(const candidate of candidates){
  if(!wikidataItem(candidate)||reviews[candidate.url]?.decision!=="self_reported_match")continue;
  if(!website)continue;
  const recorded=(Array.isArray(candidate.officialWebsites)?candidate.officialWebsites:[]).map(safeUrl).filter(Boolean);
  const same=recorded.some(url=>canonicalDomain(url)===canonicalDomain(website));
  if(same)continue;
  const missing=recorded.length===0;
  const current=missing?
   "No official website (P856) was reported by the public record lookup. The absence needs independent verification.":
   "The public record currently lists "+recorded.join(", ").slice(0,350)+" as official website(s). Confirm whether these are still current.";
  const desired="Review whether the professional's official website should include "+website+" (and whether any existing links should remain). Do not change the item until identity and sources are verified.";
  items.push({id:"review-"+candidate.id+"-official-site",platform:"wikidata",subject:text(report.subject.name,100),
   profileUrl:candidate.url,recordId:candidate.id,current,desired,discrepancyType:missing?"possibly_missing_official_site":"possible_official_site_conflict",
   basis:"public_wikidata_claims_and_customer_self_report",
   evidence:[{url:candidate.url,label:"Wikidata item "+candidate.id,kind:"unclassified"},
     {url:website,label:"Customer-supplied official website (unverified ownership)",kind:"first_party"}],
   caveat:"Needs independent corroboration and an identity review; the customer-supplied site alone is not sufficient to submit a Wikimedia correction.",
   approvalRequired:true,submissionPerformed:false});
 }
 const comparisons=Array.isArray(report.identityGraph?.comparisons)?report.identityGraph.comparisons:[];
 for(const result of comparisons.slice(0,8)){
  if(items.length>=8)break;
  const candidate=candidates.find(c=>c.id===result.subjectQid);
  if(!wikidataItem(candidate)||reviews[candidate.url]?.decision!=="self_reported_match")continue;
  if(!["possible_missing_orcid","possible_orcid_conflict","possible_missing_openalex_id"].includes(result.kind))continue;
  if(result.subjectUrl!==candidate.url||result.autoSubmit!==false||!/^A[0-9]{4,12}$/.test(result.openalexId||""))continue;
  if(result.otherUrl!=="https://openalex.org/"+result.openalexId)continue;
  const current=text(result.current,500),observed=text(result.observed,250);
  if(current.length<8||observed.length<3)continue;
  items.push({
   id:"review-"+candidate.id+"-"+result.kind+"-"+result.openalexId,
   platform:"wikidata",subject:text(report.subject.name,100),
   profileUrl:candidate.url,recordId:candidate.id,current,
   desired:"Review whether Wikidata should reflect "+observed+". This is a potential discrepancy between ID-linked records, not a verified correction.",
   discrepancyType:result.kind,basis:"wikidata_openalex_identifier_cross_reference_and_customer_self_report",
   evidence:[{url:candidate.url,label:"Wikidata public record "+candidate.id,kind:"unclassified"},
     {url:result.otherUrl,label:"OpenAlex public author record (unverified identity)",kind:"unclassified"}],
   caveat:"Source records may be incomplete or merged. Confirm the person's identity, validate ORCID ownership and obtain independent evidence before any Wikimedia submission.",
   approvalRequired:true,submissionPerformed:false
  });
 }
 return items.slice(0,8);
}
