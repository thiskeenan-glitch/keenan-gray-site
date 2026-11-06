// Ulab internal validation cohort and read-only audit triage.
// This module deliberately never edits a public record or marks a proposed change as complete.

export const PILOT_COHORT=Object.freeze([
  Object.freeze({id:"keenan-gray",name:"Keenan Gray",link:"https://www.thiskeenan.com"}),
  Object.freeze({id:"sam-ferlo",name:"Sam Ferlo",link:""}),
  Object.freeze({id:"liam-gundlach",name:"Liam Gundlach",link:""}),
  Object.freeze({id:"davis-brown",name:"Davis Brown",link:""})
]);

const safeText=(x,max=220)=>typeof x==="string"?x.trim().slice(0,max):"";
const safeHttps=value=>{
  try{const u=new URL(value);return u.protocol==="https:"&&!u.username&&!u.password?u.href:"";}
  catch{return "";}
};
const host=value=>{try{return new URL(value).hostname.replace(/^www\./,"").toLowerCase();}catch{return "";}};
export function getPilotPerson(id){
 const person=PILOT_COHORT.find(x=>x.id===id);
 if(!person)throw Error("Unknown pilot participant.");
 return person;
}
export function normalizePilotLink(link){
 const v=safeText(link,1200);
 if(!v)return "";
 return safeHttps(/^https?:\/\//i.test(v)?v:"https://"+v);
}
export function candidateExecutionRoute(finding,subjectLink){
 const id=finding?.id||"",url=finding?.url||"";
 const currentHost=host(url),subjectHost=host(subjectLink);
 // A URL provided by the customer is only an anchor, not proof they own it.
 if(subjectHost&&currentHost===subjectHost&&["site_linked_profiles","site_name","site_links","indexing","site_title"].includes(id))
   return {kind:"owner_website",next:"Verify ownership and factual evidence; obtain explicit approval and an authorized site integration."};
 if(id==="wikidata")
   return {kind:"editorial_review",next:"Confirm the exact Q-item and published sources; follow Wikimedia disclosure and editing rules."};
 return {kind:"research_only",next:"Confirm the record belongs to this person and that a real factual discrepancy exists."};
}
export function makePilotCase({personId,report,link="",ownerConsent=false}){
 const person=getPilotPerson(personId);
 if(!report||typeof report!=="object"||report.subject?.name?.trim().toLowerCase()!==person.name.toLowerCase())
   throw Error("The audit subject does not match the selected pilot participant.");
 const sourceLink=normalizePilotLink(link||report.subject?.link||person.link);
 const outcomes=(Array.isArray(report.results)?report.results:[]);
 const findings=outcomes.filter(x=>x&&["action","manual"].includes(x.status)&&safeText(x.recommendation));
 const tasks=findings.slice(0,15).map((x,i)=>{
  const route=candidateExecutionRoute(x,sourceLink);
  return {id:person.id+"-"+i,subject:person.name,title:safeText(x.title,150),
   description:safeText(x.detail,600),suggestedAction:safeText(x.recommendation,600),
   source:safeHttps(x.url||"")||null,route:route.kind,next:route.next,
   classification:"unverified_candidate",status:"needs_identity_and_evidence_review",
   sourceOwnershipVerified:false,subjectConsentRecorded:false,
   humanReviewCompleted:false,approvalRecorded:false,
   executionAttempted:false,publicChangeVerified:false};
 });
 const sources=[...new Set((Array.isArray(report.evidence)?report.evidence:[])
  .map(x=>safeHttps(x?.url||"")).filter(Boolean))].slice(0,50);
 const webStatus=safeText(report.webResearch?.status||report.coverage?.webSearch||"unknown",30);
 const summary=report.summary||{};
 return {
  schemaVersion:1,participantId:person.id,participantName:person.name,
  inputLink:sourceLink||null,generatedAt:safeText(report.generatedAt||new Date().toISOString(),45),
  origin:"ulab_discover_api",researchStatus:webStatus,
  scannedSources:sources,actionCandidates:tasks,
  counts:{researchLeads:sources.length,candidates:tasks.length,proposedEdits:0,submittedEdits:0,verifiedPublicChanges:0,
   actionFindings:Number(summary.action)||0,unknownFindings:Number(summary.unknown)||0},
  permissions:{subjectAuthorizedPublicResearch:true,ownerConsentForEdits:!!ownerConsent&&person.id==="keenan-gray",
   thirdPartyPlatformEditPermission:false},
  automation:{discovery:"system",candidateTriage:"system",submission:"not_performed",verification:"not_performed"},
  status:"research_complete_pending_human_fact_verification",
  note:"A proposed correction is not a verified error. No accounts were accessed and no third-party edits were performed."
 };
}
export function canDispatchPilotRepair(task,authorization){
 if(!task||task.classification!=="verified_factual_error")return false;
 if(!task.sourceOwnershipVerified||!task.subjectConsentRecorded||!task.humanReviewCompleted||!task.approvalRecorded)return false;
 if(!authorization?.scopedCredentialPresent||!authorization?.adapterSupportsExactChange)return false;
 // This pilot has no third-party write adapter. No inference from an email, name or link grants one.
 if(task.route!=="owner_website")return false;
 return authorization?.requestedScope==="owner_approved_patch_only";
}
