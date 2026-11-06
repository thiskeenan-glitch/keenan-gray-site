// Identity Lab Case Engine v1. Browser-only audit history: no account access or external edits.
export const CASE_SCHEMA_VERSION=3;
const clip=(value,max=1000)=>String(value??"").trim().slice(0,max);
const error=message=>{throw new Error(message);};
const today=()=>new Date().toISOString();
function date(value){if(!value||Number.isNaN(Date.parse(value)))error("Provide a valid observation date.");return new Date(value).toISOString();}
const sameHost=(a,b)=>a.replace(/^www\./,"").toLowerCase()===b.replace(/^www\./,"").toLowerCase();
function onSameRecord(task,raw){
 let url,original;
 try{url=new URL(clip(raw));original=new URL(task.profile.url);}catch{error("Enter a valid public verification URL.");}
 if(url.protocol!=="https:"||url.username||url.password||url.port||url.search||url.hash)error("Use a clean public HTTPS URL.");
 if(!sameHost(url.hostname,original.hostname))error("Verification must be on the same platform.");
 const root=decodeURIComponent(original.pathname).replace(/\/$/,"");
 const candidate=decodeURIComponent(url.pathname).replace(/\/$/,"");
 const tmdbSlug=task.platform==="tmdb"&&candidate.startsWith(root+"-")&&/^\/person\/\d+-[\w-]+$/.test(candidate);
 if(!(candidate===root||candidate.startsWith(root+"/")||tmdbSlug))error("Verification must identify the same person or record.");
 return url.href;
}
export function withHistory(task){
 if(!task||typeof task.id!=="string"||!task.profile?.url||!task.subject)error("Invalid correction task.");
 if(Array.isArray(task.activity))return task;
 const at=task.createdAt||today();
 const activity=[{type:"issue_found",at,note:"Correction issue added to the local queue."},{type:"draft_prepared",at,note:"Correction packet prepared. No third-party submission implied."}];
 if(task.submissionId)activity.push({type:"submission_recorded",at:task.updatedAt||at,receipt:clip(task.submissionId,180),source:"legacy_import",note:"Legacy operator receipt. Not independently validated."});
 if(task.status==="accepted"&&task.verifiedUrl)activity.push({type:"legacy_outcome",at:task.updatedAt||at,url:clip(task.verifiedUrl),note:"Legacy acceptance label lacks an evidence excerpt; do not count as a verified public change."});
 return {...task,activity};
}
function append(task,event){
 const t=withHistory(task);
 return {...t,activity:[...t.activity,{...event,at:event.at||today()}],updatedAt:today()};
}
export function recordSubmission(task,receipt,{source="operator_attested",at}={}){
 const value=clip(receipt,180);
 if(task.status!=="submitted"||!task.submissionId||value!==task.submissionId||value.length<6)error("A real receipt must first pass the reviewed submission workflow.");
 if(withHistory(task).activity.some(e=>e.type==="submission_recorded"&&e.receipt===value))return withHistory(task);
 return append(task,{type:"submission_recorded",receipt:value,source:clip(source,40),at:at?date(at):today(),note:"Receipt recorded. Submission does not establish editorial approval or public visibility."});
}
export function recordPublicObservation(task,{url,statement,source="operator_checked",observedAt}={}){
 if(!["operator_checked","prior_report"].includes(source))error("Unknown observation source.");
 const validated=onSameRecord(task,url),excerpt=clip(statement,500);
 if(excerpt.length<12)error("Describe the exact visible public fact.");
 return append(task,{type:"public_observation",url:validated,statement:excerpt,source,at:observedAt?date(observedAt):today(),
  note:source==="prior_report"?"Historical report; not a current live check.":"Operator attests that this fact was visible; no automated independent check."});
}
export function recordReversion(task,{url,statement}={}){
 const state=summarizeTask(task).publicState;
 if(!["operator_observed","historically_reported"].includes(state))error("A reversion needs an earlier recorded public observation.");
 const validated=onSameRecord(task,url),description=clip(statement,500);
 if(description.length<12)error("Describe the fact that is missing or reversed.");
 return append(task,{type:"public_reverted",url:validated,statement:description,note:"Operator reports that a previously observed correction is no longer visible."});
}
export function recordHumanWork(task,{minutes,note}={}){
 const count=Number(minutes),description=clip(note,200);
 if(!Number.isInteger(count)||count<1||count>480)error("Record 1–480 whole minutes for the work session.");
 if(description.length<3)error("Add a short description of the work.");
 return append(task,{type:"human_work",minutes:count,note:description});
}
export function summarizeTask(raw){
 const task=withHistory(raw);
 const events=task.activity;
 const mostRecent=[...events].reverse().find(e=>["public_observation","public_reverted"].includes(e.type));
 const publicState=!mostRecent?(events.some(e=>e.type==="legacy_outcome")?"legacy_unverified":"unchecked"):
  mostRecent.type==="public_reverted"?"reverted":mostRecent.source==="prior_report"?"historically_reported":"operator_observed";
 const receipt=task.submissionId||[...events].reverse().find(e=>e.type==="submission_recorded")?.receipt||null;
 return {publicState,submissionState:receipt?"receipt_recorded":"no_receipt",receipt,editorialState:task.status==="rejected"?"operator_recorded_rejection":"not_established",
  lastObservation:mostRecent||null,humanMinutes:events.filter(e=>e.type==="human_work").reduce((sum,e)=>sum+e.minutes,0),historyCount:events.length};
}
export function summarizeCases(tasks){
 if(!Array.isArray(tasks))error("Expected an array of correction tasks.");
 const cases=new Map();
 for(const raw of tasks){
  const task=withHistory(raw),key=task.subject.trim().toLowerCase();
  if(!cases.has(key))cases.set(key,{id:"case-"+key.replace(/[^a-z0-9]+/g,"-").slice(0,65),subject:task.subject,issues:[],humanMinutes:0,receiptCount:0,publicObservationCount:0,reversionCount:0});
  const item=cases.get(key),summary=summarizeTask(task);
  item.issues.push(task);item.humanMinutes+=summary.humanMinutes;
  if(summary.submissionState==="receipt_recorded")item.receiptCount++;
  if(["operator_observed","historically_reported"].includes(summary.publicState))item.publicObservationCount++;
  if(summary.publicState==="reverted")item.reversionCount++;
 }
 return [...cases.values()];
}
export function exportCaseFile(tasks){
 return {schemaVersion:CASE_SCHEMA_VERSION,exportedAt:today(),storage:"browser_local_only",externalEditsPerformed:false,cases:summarizeCases(tasks)};
}
