import {RULES,CHANNELS,makeTask,makePacket,transition,nextAction} from "/identity-engine.mjs";
const KEY="identitylab.operations.v2";
const $=id=>document.getElementById(id);
const node=(tag,text,cls)=>{const x=document.createElement(tag);if(text!==undefined&&text!==null)x.textContent=String(text);if(cls)x.className=cls;return x;};
let tasks=[],flashTimer;
function announce(message,error=false){const el=$("notice");el.textContent=message;el.style.color=error?"#ae4b35":"#4e7c53";clearTimeout(flashTimer);flashTimer=setTimeout(()=>{el.textContent="";},9000);}
function save(){try{localStorage.setItem(KEY,JSON.stringify(tasks));}catch{announce("Local storage unavailable. Export the JSON to retain your work.",true);}}
function label(task){return task.status==="needs_evidence"?"NEEDS EVIDENCE":task.status==="customer_action"?"CUSTOMER STEP":task.status==="ready_for_review"?"READY FOR REVIEW":task.status==="submitted"?"SUBMISSION RECORDED":task.status==="accepted"?"VERIFIED BY OPERATOR":task.status==="rejected"?"REJECTED":"DRAFT READY";}
function route(task){return CHANNELS[task.channel]||"Manual review";}
function record(task){tasks.unshift(task);save();render();}
function setTask(index,target,options){
 try{tasks[index]=transition(tasks[index],target,options);save();render();announce("Workflow state recorded locally. No external platform action was performed.");}
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
function verifyTask(task,index){
 const url=prompt("Paste the actual, public updated profile page showing the corrected fact. Do not claim success before checking the page:");
 if(!url)return;
 if(!confirm("Have you personally checked the current page and confirmed that the specified correction is visible?"))return;
 setTask(index,"accepted",{approved:true,verifiedUrl:url});
}
function finishOwner(task,index){
 if(!confirm("Has the owner completed the edit personally? Verification of the public page is still required."))return;
 verifyTask(task,index);
}
function prepareSources(task,index){
 const added=prompt("Add one or more additional public source URLs, separated by lines. Current URLs are kept:");
 if(!added)return;
 try{
  const extra=added.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map(url=>({url,label:new URL(url).hostname,kind:task.platform==="wikipedia"||task.platform==="wikidata"?"independent":"unclassified"}));
  if(!confirm("Confirm you checked that these sources genuinely support the proposed correction. Wikimedia requires appropriate independent sources; changing the label does not make a source independent."))return;
  const fresh=makeTask({subject:task.subject,platform:task.platform,profileUrl:task.profile.url,current:task.current,desired:task.desired,evidence:[...task.evidence,...extra]});
  tasks[index]={...fresh,id:task.id,createdAt:task.createdAt};save();render();announce("Evidence links updated locally. A reviewer must still validate the claims.");
 }catch(e){announce(e.message,true);}
}
async function copyText(text){
 try{await navigator.clipboard.writeText(text);announce("Prepared correction packet copied. No external edits were made.");}
 catch{announce("Clipboard access unavailable. Export your case JSON instead.",true);}
}
function render(){
 $("total").textContent=tasks.length+" task"+(tasks.length===1?"":"s");
 $("count-us").textContent=tasks.filter(t=>t.channel!=="owner"&&!["accepted","rejected"].includes(t.status)).length;
 $("count-owner").textContent=tasks.filter(t=>t.status==="customer_action").length;
 $("count-done").textContent=tasks.filter(t=>t.status==="accepted").length;
 $("export").disabled=tasks.length===0;
 const queue=$("queue");queue.replaceChildren();
 if(!tasks.length){queue.append(node("p","No corrections yet. Add a discrepancy or load the first case study.","blank"));return;}
 tasks.forEach((task,index)=>{
  const card=node("article",null,"task-card");
  const head=node("div",null,"task-header"),left=node("div");
  left.append(node("div",RULES[task.platform].label.toUpperCase()+" / "+route(task),"task-platform"),node("h3",task.subject+": "+task.platform.toUpperCase()+" correction"));
  const badge=node("span",label(task),"badge "+(task.status==="accepted"?"success":task.status==="needs_evidence"?"warning":""));head.append(left,badge);card.append(head);
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
  if(task.verifiedUrl){const a=node("a","Recorded verified public profile ↗","source-link");a.href=task.verifiedUrl;a.target="_blank";a.rel="noopener";body.append(a);}
  details.append(body);card.append(details);
  const controls=node("div",null,"task-actions");
  addButton(controls,"COPY PREPARED REQUEST",()=>copyText(makePacket(task)));
  if(task.status==="needs_evidence")addButton(controls,"ADD EVIDENCE",()=>prepareSources(task,index));
  if(task.status==="draft")addButton(controls,"MARK REVIEWED",()=>reviewTask(task,index),"dark");
  if(task.status==="ready_for_review")addButton(controls,"RECORD REAL SUBMISSION",()=>receiptPrompt(task,index),"dark");
  if(task.status==="submitted"){addButton(controls,"VERIFY ACCEPTED",()=>verifyTask(task,index));addButton(controls,"MARK REJECTED",()=>setTask(index,"rejected"));}
  if(task.status==="customer_action")addButton(controls,"VERIFY OWNER EDIT",()=>finishOwner(task,index),"dark");
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
 if(tasks.some(t=>t.subject==="Keenan Gray"&&t.platform==="imdb")){announce("Keenan's draft case already exists.");return;}
 try{
  createTask({subject:"Keenan Gray",platform:"tmdb",profileUrl:"https://www.themoviedb.org/person/5386453-keenan-gray",current:"Primary professional category: Writing; profile shows one credit and no biography.",desired:"Film director, editor and writer. Confirm directing roles before proposing missing credits.",evidence:[{url:"https://www.imdb.com/name/nm16096261/",kind:"industry",label:"IMDb director credits"},{url:"https://www.leagueoffilmmakers.com/toy-gun-throws-a-birthday-party-at-the-end-of-the-world/",kind:"independent",label:"Toy Gun filmmaker interview"}]});
  createTask({subject:"Keenan Gray",platform:"imdb",profileUrl:"https://www.imdb.com/name/nm16096261/",current:"Biography describes Seedless as the latest short film.",desired:"Biography should acknowledge Toy Gun (2026), subject to supporting directing credits and IMDb editorial review.",evidence:[{url:"https://www.imdb.com/name/nm16096261/",kind:"industry",label:"IMDb filmography"},{url:"https://www.leagueoffilmmakers.com/toy-gun-throws-a-birthday-party-at-the-end-of-the-world/",kind:"independent",label:"Published interview"}]});
  announce("Loaded Keenan's two real documented record discrepancies. Both remain drafts.");
 }catch(e){announce(e.message,true);}
});
$("export").addEventListener("click",()=>{
 const blob=new Blob([JSON.stringify({version:2,exportedAt:new Date().toISOString(),tasks},null,2)],{type:"application/json"});
 const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="identity-lab-correction-queue.json";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1800);
});
$("clear").addEventListener("click",()=>{if(!confirm("Delete this browser's saved correction queue?"))return;tasks=[];localStorage.removeItem(KEY);render();announce("Local queue cleared.");});
try{const saved=JSON.parse(localStorage.getItem(KEY)||"[]");if(Array.isArray(saved)&&saved.length<101&&saved.every(t=>RULES[t.platform]&&t.profile&&typeof t.current==="string"))tasks=saved;}catch{}
render();
