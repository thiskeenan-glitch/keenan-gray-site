// Ulab four-person, system-run validation pilot.
// Public records are unverified identity candidates until matched by evidence.
// No owner or third-party edit permission is inferred from a public name or URL.

export const PILOT_COHORT=Object.freeze([
 Object.freeze({id:"keenan-gray",name:"Keenan Gray",link:"https://www.thiskeenan.com"}),
 Object.freeze({id:"sam-ferlo",name:"Sam Ferlo",link:""}),
 Object.freeze({id:"liam-gundlach",name:"Liam Gundlach",link:""}),
 Object.freeze({id:"davis-brown",name:"Davis Brown",link:""})
]);

const clip=(value,max=200)=>typeof value==="string"?value.trim().slice(0,max):"";
const https=value=>{
 try{const u=new URL(value);return u.protocol==="https:"&&!u.username&&!u.password&&!u.port?u.href:"";}
 catch{return "";}
};
const hostname=value=>{try{return new URL(value).hostname.replace(/^www\./,"").toLowerCase();}catch{return "";}};

export function getPilotPerson(id){
 const person=PILOT_COHORT.find(x=>x.id===id);
 if(!person)throw Error("Unknown pilot participant.");
 return person;
}
export function normalizePilotLink(raw){
 const value=clip(raw,1200);
 return !value?"":https(/^https?:\/\//i.test(value)?value:"https://"+value);
}

const siteIssueIds=new Set(["site_linked_profiles","site_name","site_links","indexing","site_title"]);
export function candidateExecutionRoute(finding,subjectLink,siteInspected){
 const id=clip(finding?.id,80),url=finding?.url||"";
 const siteHost=hostname(subjectLink),foundHost=hostname(url);
 if(siteInspected&&siteHost&&siteHost===foundHost&&siteIssueIds.has(id))
  return {kind:"owner_website",next:"Confirm the gap is material, prove site ownership and authorize a specific edit."};
 if(id==="wikidata")
  return {kind:"editorial_review",next:"Check the precise Q-item and cited references. Disclose any paid affiliation."};
 return {kind:"research_only",next:"Disambiguate the source and verify a real factual discrepancy."};
}

export function makePilotCase({personId,report,link=""}){
 const person=getPilotPerson(personId);
 if(!report||typeof report!=="object"||clip(report.subject?.name,120).toLowerCase()!==person.name.toLowerCase())
  throw Error("The audit subject does not match this pilot participant.");
 const supplied=normalizePilotLink(link||report.subject?.link||person.link);
 const siteInspected=!!(report.site?.parsed&&report.site?.url&&hostname(report.site.url)===hostname(supplied));
 const findings=Array.isArray(report.results)?report.results:[];
 // Generic advice, name-only matches, unverified panels, and manually observed third-party
 // candidates are deliberately not classified as repair opportunities.
 const opportunities=findings.filter(x=>
  x&&x.status==="action"&&siteIssueIds.has(x.id)&&
  !!https(x.url||"")&&!!clip(x.recommendation,600)&&siteInspected&&
  hostname(x.url)===hostname(supplied)
 ).slice(0,12).map((finding,i)=>{
  const route=candidateExecutionRoute(finding,supplied,siteInspected);
  return {
   id:person.id+"-candidate-"+i,title:clip(finding.title,160),
   observed:clip(finding.detail,600),suggestedAction:clip(finding.recommendation,600),
   source:https(finding.url),route:route.kind,next:route.next,
   classification:"potential_gap_not_verified_error",
   status:"needs_identity_evidence_and_owner_review",
   sourceOwnershipVerified:false,subjectConsentRecorded:false,
   humanReviewCompleted:false,approvalRecorded:false,
   executionAttempted:false,publicChangeVerified:false
  };
 });
 const sources=[...new Set((Array.isArray(report.evidence)?report.evidence:[])
  .map(x=>https(x?.url||"")).filter(Boolean))].slice(0,40);
 const intelligence=report.intelligence&&typeof report.intelligence==="object"?report.intelligence:null;
 const graph=intelligence?.graph&&typeof intelligence.graph==="object"?intelligence.graph:{linked:[],contextual:[],ambiguous:[],counts:{linked:0,contextual:0,ambiguous:0}};
 const matches={
  linked:(graph.linked||[]).slice(0,16).map(x=>({url:https(x.url),title:clip(x.title,160),
   reason:clip(x.signals?.join("; "),200),confidence:"linked_source_requires_confirmation"})).filter(x=>x.url),
  contextual:(graph.contextual||[]).slice(0,12).map(x=>({url:https(x.url),title:clip(x.title,160),
   reason:clip(x.signals?.join("; "),200),confidence:"needs_independent_identity_confirmation"})).filter(x=>x.url),
  ambiguous:(graph.ambiguous||[]).slice(0,16).map(x=>({url:https(x.url),title:clip(x.title,160),
   reason:clip(x.signals?.join("; "),200),confidence:"likely_namesake_or_unknown"})).filter(x=>x.url)
 };
 const thirdPartyCandidates=(Array.isArray(intelligence?.discrepancies)?intelligence.discrepancies:[]).slice(0,5).map(x=>({
  id:clip(x.id,180),platform:clip(x.platform,30),recordUrl:https(x.recordUrl),
  status:"requires_live_fact_check_before_correction",
  currentStatement:clip(x.currentStatement,550),
  conflictingStatement:clip(x.conflictingStatement,550),
  proposedAction:clip(x.proposedAction,650),
  evidence:(Array.isArray(x.evidence)?x.evidence:[]).slice(0,4).map(y=>({
   url:https(y.url),title:clip(y.title,160),excerpt:clip(y.excerpt,500)
  })).filter(y=>y.url),
  actor:"ulab_system",submissionPerformed:false,publicChangeVerified:false
 }));
 const researchStatus=clip(report.webResearch?.status||report.coverage?.webSearch||"unknown",40);
 const generated=report.generatedAt&&Number.isFinite(Date.parse(report.generatedAt))?new Date(report.generatedAt).toISOString():new Date().toISOString();
 return {
  schemaVersion:3,participantId:person.id,participantName:person.name,
  inputLink:supplied||null,generatedAt:generated,
  source:"ulab_discover_api",researchStatus,
  sourceLeads:sources,opportunities,identityMatches:matches,thirdPartyCandidates,
  intelligence:{version:intelligence?.version||null,investigationStatus:clip(intelligence?.investigationStatus,80),imdbResearchStatus:clip(intelligence?.imdbResearchStatus,80)},
  counts:{sourceLeads:sources.length,potentialGaps:opportunities.length,linkedIdentityLeads:matches.linked.length,
   contextualIdentityLeads:matches.contextual.length,ambiguousIdentityLeads:matches.ambiguous.length,
   thirdPartyCandidates:thirdPartyCandidates.length,proposedEdits:0,
   submittedEdits:0,verifiedPublicChanges:0,humanMinutes:0},
  permission:{publicResearchOnly:true,participantAuthorizedEdits:false,
   siteOwnershipVerified:false,thirdPartyEditPermission:false},
  actorTrail:[{phase:"discovery",actor:"ulab_system",status:"completed",at:generated},
   {phase:"triage",actor:"ulab_system",status:"completed",at:generated},
   {phase:"external_edit",actor:"none",status:"blocked_pending_explicit_permission",at:generated},
   {phase:"live_verification",actor:"none",status:"not_started",at:generated}],
  status:"research_finished_pending_evidence_review",
  disclaimer:"Source leads may be namesakes. A possible gap is not necessarily a factual error. No external changes or submissions have been made."
 };
}

export function canDispatchPilotRepair(task,authorization){
 if(!task||task.classification!=="verified_factual_error")return false;
 if(!task.sourceOwnershipVerified||!task.subjectConsentRecorded||!task.humanReviewCompleted||!task.approvalRecorded)return false;
 if(!authorization?.scopedCredentialPresent||!authorization?.adapterSupportsExactChange)return false;
 if(task.route!=="owner_website")return false;
 return authorization.requestedScope==="owner_approved_patch_only";
}


// Reusable evidence-only contributor brief generated from a system-detected case.
// Not a substitute for the live source check or an official platform submission.
export function draftImdbContributorBrief(candidate){
 if(candidate?.platform!=="imdb"||typeof candidate.recordUrl!=="string"||
  !/^https:\/\/www\.imdb\.com\/name\/nm[0-9]+\/$/.test(candidate.recordUrl))
  throw Error("Only an anchored IMDb name-page candidate may generate this brief.");
 if(!candidate.currentStatement||!candidate.conflictingStatement||!Array.isArray(candidate.evidence)||
  candidate.evidence.length<2)throw Error("Candidate needs two independently recorded evidence excerpts.");
 const sources=candidate.evidence.filter(x=>x.url===candidate.recordUrl&&x.excerpt);
 if(sources.length<2)throw Error("Only evidence from the exact person page can be used.");
 return [
  "ULAB · IMDb BIOGRAPHY CHRONOLOGY REVIEW",
  "STATUS: RESEARCH CANDIDATE · NO EDIT SUBMITTED",
  "",
  "PROFILE: "+candidate.recordUrl,
  "POSSIBLY OUTDATED BIOGRAPHY:",
  candidate.currentStatement,
  "",
  "CONFLICTING CREDIT EVIDENCE:",
  candidate.conflictingStatement,
  "",
  "NEXT ACTION:",
  "Confirm the exact live biography text and whether the film chronology is factually correct.",
  "If the statement is outdated, propose accurate, neutral, sourced wording via IMDb's official contributor interface.",
  "IMDb approval and the final public page cannot be guaranteed.",
  "",
  "EVIDENCE / INDEXED EXCERPTS (MAY BE STALE):",
  ...sources.slice(0,4).map(x=>"- "+clip(x.excerpt,500)+"\n  "+x.url),
  "",
  "IMDb CONTRIBUTOR GUIDANCE:",
  "https://help.imdb.com/article/contribution/contribution-information/how-do-i-contribute-data-to-imdb/G3G5Z4MZJUR6D9Q8",
  "",
  "No IMDb account was accessed. No submission, acceptance, or live update occurred."
 ].join("\n");
}
