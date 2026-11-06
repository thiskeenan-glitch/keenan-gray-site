import {RULES,CHANNELS,makeTask,makePacket,transition,nextAction} from "/identity-engine.mjs";
import {withHistory,recordSubmission,recordPublicObservation,recordReversion,recordHumanWork,summarizeTask,summarizeCases,exportCaseFile} from "/case-engine.mjs";
const KEY="identitylab.operations.v2";
const $=id=>document.getElementById(id);
const node=(tag,text,cls)=>{const x=document.createElement(tag);if(text!==undefined&&text!==null)x.textContent=String(text);if(cls)x.className=cls;return x;};
let tasks=[],flashTimer;
function announce(message,error=false){const el=$("notice");el.textContent=message;el.style.color=error?"#ae4b35":"#4e7c53";clearTimeout(flashTimer);flashTimer=setTimeout(()=>{el.textContent="";},9000);}
function save(){try{localStorage.setItem(KEY,JSON.stringify(tasks));}catch{announce("Local storage unavailable. Export the JSON to retain your work.",true);}}
function label(task){return task.status==="needs_evidence"?"NEEDS EVIDENCE":task.status==="customer_action"?"CUSTOMER STEP":task.status==="ready_for_review"?"READY FOR REVIEW":task.status==="submitted"?"SUBMISSION RECORDED":task.status==="accepted"?"VERIFIED BY OPERATOR":task.status==="rejected"?"REJECTED":"DRAFT READY";}
function route(task){return CHANNELS[task.channel]||"Manual review";}
function record(task){tasks.unshift(withHistory(task));save();render();}
function setTask(index,target,options){
 try{let next=transition(tasks[index],target,options);if(target==="submitted")next=recordSubmission(next,options.receipt);tasks[index]=withHistory(next);save();render();announce("Workflow state recorded locally. No external platform action was performed.");}
 catch(e){announce(e.message,true);}
}
function updateRouteHint(){const r=RULES[$("platform").value];$("channel-hint").textContent="Route: "+(CHANNELS[r.channel]||r.channel)+". "+r.method+"."; }
function getEvidence(){const kind=$("source-kind").value;return $("sources").value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean).map(url=>({url,label:new URL(url).hostname,kind}));}
function createTask(fields){const task=makeTask(fields);record(task);return task;}
function addButton(parent,labelText,action,style="light"){const b=node("button",labelText,"btn "+style);b.type="button";b.addEventListener("click",action);parent.append(b);return b;}
function receiptPrompt(task,index){
 if(task.status!=="ready_for_review")return;
 const receipt=prompt("Enter the authentic platform submission or discussion reference (not a made-up ID):");
 if(!receipt)return;
 if(!confirm("Did you actually submit the evidence-backed request through the official platform, and is this its real reference?"))return;
 setTask(index,"submitted",{reviewed:true,approved:true,receipt});
}
function reviewTask(task,index){
 if(task.status==="needs_evidence"){announce("Add evidence and recreate this task. It cannot advance without citations.",true);return;}
 if(task.channel==="owner"){announce("This is an owner action; use the drafted customer instructions.",true);return;}
 if(!confirm("I have checked the profile belongs to this person, and every proposed fact is supported by the supplied sources."))return;
 if(task.channel==="editorial_request"&&!confirm("For any paid or connected Wikimedia work, will you disclose the relationship in the required manner and request review rather than edit covertly?"))return;
 setTask(index,"ready_for_review",{reviewed:true});
}
function observePublic(task,index){
 const url=prompt("Enter the current public person/profile page URL:",task.profile.url);
 if(!url)return;
 const statement=prompt("What exact factual correction did you see on the public page? Include the text or specific credited role:");
 if(!statement)return;
 if(!confirm("Have you personally checked this public page and seen this specific fact? This records your observation, not an editorial approval or an automated verification."))return;
 try{tasks[index]=recordPublicObservation(task,{url,statement});save();render();announce("Public observation recorded locally; editorial status has NOT changed.");}catch(e){announce(e.message,true);}
}
function reversePublic(task,index){
 const url=prompt("Link to the public profile where the earlier correction is now missing:",task.profile.url);if(!url)return;
 const statement=prompt("Describe what changed or disappeared on the page:");if(!statement)return;
 if(!confirm("Have you personally confirmed the earlier fact is no longer visible?"))return;
 try{tasks[index]=recordReversion(task,{url,statement});save();render();announce("Possible public reversion recorded locally. Follow-up is required.");}catch(e){announce(e.message,true);}
}
function logWork(task,index){
 const minutes=prompt("How many whole minutes of human work did this correction take?");if(!minutes)return;
 const note=prompt("Briefly describe that work:");if(!note)return;
 try{tasks[index]=recordHumanWork(task,{minutes:Number(minutes),note});save();render();announce("Human work time logged locally.");}catch(e){announce(e.message,true);}
}
function prepareSources(task,index){
 const added=prompt("Add one or more additional public source URLs, separated by lines. Current URLs are kept:");
 if(!added)return;
 try{
  const extra=added.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map(url=>({url,label:new URL(url).hostname,kind:task.platform==="wikipedia"||task.platform==="wikidata"?"independent":"unclassified"}));
  if(!confirm("Confirm you checked that these sources genuinely support the proposed correction. Wikimedia requires appropriate independent sources; changing the label does not make a source independent."))return;
  const fresh=makeTask({subject:task.subject,platform:task.platform,profileUrl:task.profile.url,current:task.current,desired:task.desired,evidence:[...task.evidence,...extra]});
  tasks[index]={...fresh,id:task.id,createdAt:task.createdAt,activity:[...withHistory(task).activity,{type:"evidence_updated",at:new Date().toISOString(),note:"Operator added supporting source URLs. Source content still needs checking."}]};save();render();announce("Evidence links updated locally. A reviewer must still validate the claims.");
 }catch(e){announce(e.message,true);}
}
async function copyText(text){
 try{await navigator.clipboard.writeText(text);announce("Prepared correction packet copied. No external edits were made.");}
 catch{announce("Clipboard access unavailable. Export your case JSON instead.",true);}
}
function render(){
 const cases=summarizeCases(tasks);
 const metrics={publicReports:cases.reduce((n,c)=>n+c.publicObservationCount,0),receipts:cases.reduce((n,c)=>n+c.receiptCount,0),minutes:cases.reduce((n,c)=>n+c.humanMinutes,0)};
 $("case-count").textContent=cases.length;
 $("observed-count").textContent=metrics.publicReports;
 $("receipt-count").textContent=metrics.receipts;
 $("work-minutes").textContent=metrics.minutes;
 $("total").textContent=tasks.length+" task"+(tasks.length===1?"":"s");
 $("count-us").textContent=tasks.filter(t=>t.channel!=="owner"&&!["accepted","rejected"].includes(t.status)).length;
 $("count-owner").textContent=tasks.filter(t=>t.status==="customer_action").length;
 $("count-done").textContent=tasks.filter(t=>["operator_observed","historically_reported"].includes(summarizeTask(t).publicState)).length;
 $("export").disabled=tasks.length===0;
 const queue=$("queue");queue.replaceChildren();
 if(!tasks.length){queue.append(node("p","No corrections yet. Add a discrepancy or load the first case study.","blank"));return;}
 tasks.forEach((task,index)=>{
  const card=node("article",null,"task-card");
  const head=node("div",null,"task-header"),left=node("div");
  left.append(node("div",RULES[task.platform].label.toUpperCase()+" / "+route(task),"task-platform"),node("h3",task.subject+": "+task.platform.toUpperCase()+" correction"));
  const badge=node("span",label(task),"badge "+(task.status==="accepted"?"success":task.status==="needs_evidence"?"warning":""));head.append(left,badge);card.append(head);
  const state=summarizeTask(task);
  const stateNote=state.publicState==="operator_observed"?"PUBLIC OBSERVATION RECORDED (NOT EDITORIAL APPROVAL)":state.publicState==="historically_reported"?"HISTORICAL PUBLIC REPORT (NOT RECHECKED)":state.publicState==="reverted"?"POSSIBLE PUBLIC REVERSION":state.publicState==="legacy_unverified"?"LEGACY OUTCOME (UNVERIFIED)":"PUBLIC VISIBILITY NOT RECORDED";
  card.append(node("p",stateNote+" · "+(state.receipt?"SUBMISSION RECEIPT RECORDED":"NO SUBMISSION RECEIPT")+" · "+state.humanMinutes+" HUMAN MINUTES","task-explanation"));
  const shift=node("div",null,"change");
  shift.append(node("span","CURRENT","change-label"),node("p",task.current),node("span","CORRECT","change-label"),node("p",task.desired,"correct"));card.append(shift);
  card.append(node("p",nextAction(task),"task-explanation"));
  const details=node("details");details.append(node("summary","Sources and permissions"));
  const body=node("div",null,"details-content");body.append(node("p",RULES[task.platform].policy));
  const link=node("a","View original profile ↗","source-link");link.href=task.profile.url;link.rel="noopener";link.target="_blank";body.append(link);
  if(task.platform==="wikipedia"){const talk=node("a","Open article talk page ↗","source-link");talk.href=task.profile.talkUrl;talk.rel="noopener";talk.target="_blank";body.append(talk);}
  for(const evidence of task.evidence){const a=node("a",evidence.url+" ("+evidence.kind+") ↗","source-link");a.href=evidence.url;a.target="_blank";a.rel="noopener";body.append(a);}
  if(task.missing.length)body.append(node("p",task.missing.join(" "),"requirement"));
  if(task.submissionId)body.append(node("p","Operator-recorded submission reference: "+task.submissionId,"receipt"));
  if(task.verifiedUrl){const a=node("a","Legacy operator acceptance URL (not independent verification) ↗","source-link");a.href=task.verifiedUrl;a.target="_blank";a.rel="noopener";body.append(a);}
  const activity=node("section",null,"activity-log");activity.append(node("h4","Case history (operator and historical records)"));
  for(const event of [...withHistory(task).activity].reverse()){
   const line=node("p",String(event.at||"").slice(0,16)+" / "+event.type.replace(/_/g," ").toUpperCase()+" / "+(event.statement||event.note||event.receipt||""),"activity-item");
   activity.append(line);
  }
  body.append(activity);
  details.append(body);card.append(details);
  const controls=node("div",null,"task-actions");
  addButton(controls,"COPY PREPARED REQUEST",()=>copyText(makePacket(task)));
  if(task.status==="needs_evidence")addButton(controls,"ADD EVIDENCE",()=>prepareSources(task,index));
  if(task.status==="draft")addButton(controls,"MARK REVIEWED",()=>reviewTask(task,index),"dark");
  if(task.status==="ready_for_review")addButton(controls,"RECORD REAL SUBMISSION",()=>receiptPrompt(task,index),"dark");
  if(task.status==="submitted")addButton(controls,"MARK REJECTED",()=>setTask(index,"rejected"));
  addButton(controls,"RECORD PUBLIC OBSERVATION",()=>observePublic(task,index));
  if(["operator_observed","historically_reported"].includes(state.publicState))addButton(controls,"RECORD REVERSION",()=>reversePublic(task,index));
  addButton(controls,"LOG HUMAN MINUTES",()=>logWork(task,index));
  if(task.status==="rejected")addButton(controls,"REOPEN DRAFT",()=>setTask(index,"draft"));
  card.append(controls);queue.append(card);
 });
}
$("platform").addEventListener("change",updateRouteHint);updateRouteHint();
$("issue-form").addEventListener("submit",event=>{
 event.preventDefault();
 try{
  const data={subject:$("subject").value,platform:$("platform").value,profileUrl:$("profile").value,current:$("current").value,desired:$("desired").value,evidence:getEvidence()};
  const task=createTask(data);
  announce("Created a "+RULES[task.platform].label+" correction. Routed to: "+route(task)+".");
 }catch(e){announce(e.message,true);}
});
$("load-keenan").addEventListener("click",()=>{
 if(tasks.some(t=>t.subject==="Keenan Gray")){announce("A Keenan Gray case already exists in this browser. Export your current queue before clearing/reloading the new baseline.");return;}
 try{
  const sources=[{url:"https://www.imdb.com/name/nm16096261/",kind:"industry",label:"IMDb person record"},{url:"https://www.leagueoffilmmakers.com/toy-gun-throws-a-birthday-party-at-the-end-of-the-world/",kind:"independent",label:"Toy Gun filmmaker feature"}];
  let imdb=makeTask({subject:"Keenan Gray",platform:"imdb",profileUrl:"https://www.imdb.com/name/nm16096261/",current:"Earlier biography omitted Toy Gun (2026).",desired:"Biography mentions Toy Gun (2026).",evidence:sources});
  imdb=transition(imdb,"ready_for_review",{reviewed:true});
  imdb=transition(imdb,"submitted",{reviewed:true,approved:true,receipt:"261105-215119-060000"});
  imdb=recordSubmission(imdb,"261105-215119-060000",{source:"user_provided_receipt",at:"2026-11-05"});
  imdb=recordPublicObservation(imdb,{url:"https://www.imdb.com/name/nm16096261/bio/",statement:"The biography includes Toy Gun (2026), according to the public report on November 5, 2026.",source:"prior_report",observedAt:"2026-11-05"});
  record(imdb);
  let tmdbBio=makeTask({subject:"Keenan Gray",platform:"tmdb",profileUrl:"https://www.themoviedb.org/person/5386453-keenan-gray",current:"The TMDb baseline had no biography.",desired:"A factual professional biography is visible.",evidence:sources});
  tmdbBio=recordPublicObservation(tmdbBio,{url:"https://www.themoviedb.org/person/5386453-keenan-gray",statement:"A biography was reported visible on November 5, 2026, without any confirmed Identity Lab contribution.",source:"prior_report",observedAt:"2026-11-05"});
  record(tmdbBio);
  record(makeTask({subject:"Keenan Gray",platform:"tmdb",profileUrl:"https://www.themoviedb.org/person/5386453-keenan-gray",current:"Known For department shows Writing.",desired:"Correct the primary department to Directing if supported by verified credits.",evidence:sources}));
  record(makeTask({subject:"Keenan Gray",platform:"tmdb",profileUrl:"https://www.themoviedb.org/person/5386453-keenan-gray",current:"One known credit: Seedless as writer; directing credits not shown.",desired:"Review existing film records and add only independently supported directing roles where permitted.",evidence:sources}));
  announce("Loaded four separate issues. IMDb has the user-provided receipt; public visibility is historical reporting only. TMDb has NO recorded contribution.");
 }catch(e){announce(e.message,true);}
});
$("export").addEventListener("click",()=>{
 const blob=new Blob([JSON.stringify(exportCaseFile(tasks),null,2)],{type:"application/json"});
 const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="identity-lab-case-history.json";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1800);
});
$("clear").addEventListener("click",()=>{if(!confirm("Delete this browser's saved correction queue?"))return;tasks=[];localStorage.removeItem(KEY);render();announce("Local queue cleared.");});
try{const saved=JSON.parse(localStorage.getItem(KEY)||"[]");if(Array.isArray(saved)&&saved.length<101&&saved.every(t=>RULES[t.platform]&&t.profile&&typeof t.current==="string"))tasks=saved.map(withHistory);}catch{}
render();
