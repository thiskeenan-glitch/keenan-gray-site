// Public identity observations -> evidence-gated correction-review suggestions.
// No submissions. A self-reported candidate is not independently verified.
const text=(v,n=400)=>String(v??"").trim().slice(0,n);
const isWebsite=report=>report?.subject?.linkType==="website"&&typeof report?.subject?.link==="string";
const wikidataItem=c=>c&&/^Q[1-9][0-9]*$/.test(c.id||"")&&c.url==="https://www.wikidata.org/wiki/"+c.id;
function canonicalDomain(url){try{return new URL(url).hostname.toLowerCase().replace(/^www\./,"");}catch{return null;}}
function safeUrl(v){try{const u=new URL(v);return u.protocol==="https:"&&!u.username&&!u.password&&!u.port&&u.hostname.includes(".")?u.href:null;}catch{return null;}}
export function draftOpportunities(report,{reviews={}}={}){
 if(!isWebsite(report))return [];
 const website=safeUrl(report.subject.link);
 if(!website)return [];
 const candidates=Array.isArray(report.candidates?.wikidata)?report.candidates.wikidata:[];
 const items=[];
 for(const candidate of candidates){
  if(!wikidataItem(candidate)||reviews[candidate.url]?.decision!=="self_reported_match")continue;
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
 return items.slice(0,5);
}
