import {PILOT_COHORT,normalizePilotLink,makePilotCase} from "/pilot-engine.mjs";

const $=id=>document.getElementById(id);
const STORE="ulab.validation.cohort.v1";
const el=(tag,className,value)=>{
 const x=document.createElement(tag);
 if(className)x.className=className;
 if(value!==undefined)x.textContent=String(value);
 return x;
};
const saved=(()=>{
 try{const data=JSON.parse(localStorage.getItem(STORE)||"{}");return data&&typeof data==="object"&&!Array.isArray(data)?data:{};}
 catch{return {};}
})();
const state={};
for(const person of PILOT_COHORT){
 const item=saved[person.id];
 state[person.id]={
  link:typeof item?.link==="string"?item.link:person.link,
  report:item?.report?.schemaVersion===2&&item.report.participantId===person.id?item.report:null,
  error:"",loading:false
 };
}
let running=false;

function persist(){
 const output={};
 for(const person of PILOT_COHORT){
  const value=state[person.id];
  output[person.id]={link:value.link,report:value.report};
 }
 try{localStorage.setItem(STORE,JSON.stringify(output));return true;}
 catch{return false;}
}
function totals(){
 const reports=PILOT_COHORT.map(p=>state[p.id].report).filter(Boolean);
 $("scans-count").textContent=reports.length+" / "+PILOT_COHORT.length;
 $("leads-count").textContent=reports.reduce((sum,r)=>sum+r.counts.sourceLeads,0);
 $("gaps-count").textContent=reports.reduce((sum,r)=>sum+r.counts.potentialGaps,0);
 $("verified-count").textContent="0";
 $("run-all").disabled=running;
 for(const btn of document.querySelectorAll(".run-person"))btn.disabled=running;
}
function sourceLink(url){
 try{
  const u=new URL(url);
  if(u.protocol!=="https:")return null;
  const anchor=el("a","",u.hostname+u.pathname.slice(0,85));
  anchor.href=u.href;anchor.target="_blank";anchor.rel="noopener noreferrer";
  return anchor;
 }catch{return null;}
}
function renderCase(slot,report){
 slot.replaceChildren();
 if(!report){slot.hidden=true;return;}
 slot.hidden=false;
 const meta=el("div","report-meta");
 for(const [number,label] of [
  [report.counts.sourceLeads,"SOURCE LEADS"],
  [report.counts.potentialGaps,"POTENTIAL GAPS"],
  [report.counts.verifiedPublicChanges,"VERIFIED REPAIRS"]
 ]){
  const block=el("div");block.append(el("strong","",number),el("span","",label));meta.append(block);
 }
 slot.append(meta);
 const latest=new Date(report.generatedAt).toLocaleString();
 slot.append(el("p","",latest+" · Audited by Ulab · "+report.researchStatus+" web coverage"));
 slot.append(el("h4","","Correction candidates"));
 if(!report.opportunities.length){
  slot.append(el("p","empty","No evidence-backed website correction candidate surfaced in this scan. This is not proof there are no problems elsewhere. Human source-matching review is required."));
 }else{
  for(const item of report.opportunities){
   const gap=el("div","gap");
   gap.append(el("strong","",item.title));
   gap.append(el("p","",item.observed));
   gap.append(el("p","",item.suggestedAction));
   gap.append(el("p","tag","POTENTIAL GAP · NOT AN APPROVED EDIT"));
   slot.append(gap);
  }
 }
 slot.append(el("h4","","Public source leads (unverified)"));
 const sources=el("div","sources");
 for(const url of report.sourceLeads.slice(0,8)){
  const link=sourceLink(url);if(link)sources.append(link);
 }
 slot.append(sources);
 if(report.sourceLeads.length>8)slot.append(el("p","empty","Showing 8 of "+report.sourceLeads.length+" source leads."));
 if(!report.sourceLeads.length)slot.append(el("p","empty","No usable public source leads found in this run."));
 slot.append(el("p","warn","No external changes were made. A public URL does not establish this is the correct person."));
}
function renderPeople(){
 const holder=$("people");holder.replaceChildren();
 for(const [i,person] of PILOT_COHORT.entries()){
  const data=state[person.id],card=el("article","person");
  card.dataset.personId=person.id;
  const head=el("div","person-head"),nameGroup=el("div"),badge=el("span","status"+(data.error?" error":data.report?" completed":""),
   data.loading?"RUNNING":data.error?"ERROR":data.report?"AUDITED":"NOT SCANNED");
  nameGroup.append(el("span","person-index",String(i+1).padStart(2,"0")+" / PILOT"),el("h3","",person.name));
  head.append(nameGroup,badge);card.append(head);
  const id="link-"+person.id,label=el("label","","IDENTITY ANCHOR · OPTIONAL");
  label.htmlFor=id;card.append(label);
  const input=el("input");input.id=id;input.value=data.link;input.placeholder="Official website, LinkedIn, IMDb, or leave blank";input.maxLength=1200;
  input.addEventListener("change",()=>{data.link=input.value.trim();persist();});
  card.append(input);
  const foot=el("div","person-foot"),run=el("button","run-person","Run audit ↗");
  run.type="button";run.dataset.scanId=person.id;run.disabled=running;
  run.addEventListener("click",()=>startOne(person.id));
  foot.append(run,el("span","person-count",data.loading?"Scanning public sources…":data.error?data.error:data.report?"Last scanned "+new Date(data.report.generatedAt).toLocaleDateString():"Research not started"));
  card.append(foot);
  const report=el("div","case-report");renderCase(report,data.report);card.append(report);
  holder.append(card);
 }
 totals();
}
function status(message){$("global-status").textContent=message;}
async function runScan(personId){
 const person=PILOT_COHORT.find(x=>x.id===personId),data=state[personId];
 if(!person)throw Error("Unknown pilot participant.");
 const normalized=normalizePilotLink(data.link);
 if(data.link.trim()&&!normalized)throw Error("Use a valid HTTPS public identity link.");
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),45000);
 try{
  const response=await fetch("/api/discover",{method:"POST",headers:{"Content-Type":"application/json"},
   body:JSON.stringify({name:person.name,link:normalized}),signal:controller.signal});
  let result;
  try{result=await response.json();}catch{throw Error("The research API returned an unreadable response.");}
  if(!response.ok)throw Error(result?.error||"Research request failed.");
  const report=makePilotCase({personId,report:result,link:normalized});
  // A missing search provider is disclosed rather than framed as complete research.
  data.report=report;
  if(!persist())throw Error("The scan finished, but browser storage was unavailable. Export the results before leaving.");
  return report;
 }finally{clearTimeout(timer);}
}
async function startOne(id){
 if(running)return;running=true;
 const person=PILOT_COHORT.find(x=>x.id===id),data=state[id];
 data.loading=true;data.error="";status("Ulab is researching "+person.name+"…");renderPeople();
 try{
  const report=await runScan(id);
  status("Research finished for "+person.name+". "+report.counts.sourceLeads+" public leads; "+report.counts.potentialGaps+" potential website gaps. No edits made.");
 }catch(error){
  data.error=String(error.message||"Research failed.").slice(0,160);
  status(person.name+": "+data.error);
 }finally{data.loading=false;running=false;renderPeople();}
}
async function startAll(){
 if(running)return;running=true;let completed=0,failed=0;
 for(const person of PILOT_COHORT){
  const data=state[person.id];data.loading=true;data.error="";
  status("Ulab researching "+person.name+" · "+(completed+failed+1)+" of "+PILOT_COHORT.length);
  renderPeople();
  try{await runScan(person.id);completed++;}
  catch(error){data.error=String(error.message||"Research failed.").slice(0,160);failed++;}
  finally{data.loading=false;}
 }
 running=false;renderPeople();
 status("System research complete: "+completed+" successful, "+failed+" unsuccessful. No accounts accessed or external edits submitted.");
}
function exportReports(){
 const reports=PILOT_COHORT.map(person=>({participant:person.name,report:state[person.id].report})),
  data={program:"Ulab four-person system validation",createdAt:new Date().toISOString(),
   cohort:PILOT_COHORT.map(person=>person.name),scans:reports,
   correctionsPerformed:0,verificationPerformed:0,
   note:"These are system-generated research summaries, not verified identity changes."};
 const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"})),
  link=el("a");link.href=url;link.download="ulab-four-person-pilot.json";
 document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$("run-all").addEventListener("click",startAll);
$("export").addEventListener("click",exportReports);
renderPeople();
