import {PILOT_COHORT,normalizePilotLink,makePilotCase,draftImdbContributorBrief} from "/pilot-engine.mjs";
import {buildIdentityGraph,compareIdentityGraphs,graphPortfolio} from "/identity-graph.mjs";
import {renderIdentityGraph} from "/identity-graph-ui.mjs";
import {saveGraphToAccount,loadGraphFromAccount} from "/identity-graph-store.mjs";

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
  report:item?.report?.schemaVersion===3&&item.report.participantId===person.id?item.report:null,
  graph:item?.graph?.schemaVersion===1&&item.graph.subject?.id===person.id?item.graph:null,
  comparison:item?.comparison?.version===1&&item.comparison.subjectId===person.id?item.comparison:null,
  error:"",loading:false
 };
}
let running=false;
let accountEnabled=false;

function persist(){
 const output={};
 for(const person of PILOT_COHORT){
  const value=state[person.id];
  output[person.id]={link:value.link,report:value.report,graph:value.graph,comparison:value.comparison};
 }
 try{localStorage.setItem(STORE,JSON.stringify(output));return true;}
 catch{return false;}
}
function totals(){
 const reports=PILOT_COHORT.map(p=>state[p.id].report).filter(r=>r&&["ok","partial"].includes(r.researchStatus));
 $("scans-count").textContent=reports.length+" / "+PILOT_COHORT.length;
 $("leads-count").textContent=graphPortfolio(PILOT_COHORT.map(p=>state[p.id].graph).filter(Boolean)).sources;
 $("gaps-count").textContent=reports.reduce((sum,r)=>sum+r.counts.potentialGaps+(r.counts.thirdPartyCandidates||0),0);
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
 slot.append(el("h4","","Identity source matching"));
 const matches=report.identityMatches||{linked:[],contextual:[],ambiguous:[]};
 const matchSections=[
  ["LINKED PROFILE LEADS",matches.linked],
  ["CONTEXTUAL CANDIDATES · VERIFY IDENTITY",matches.contextual],
  ["AMBIGUOUS / POSSIBLE NAMESAKES",matches.ambiguous]
 ];
 for(const [heading,items] of matchSections){
  slot.append(el("p","tag",heading+" · "+items.length));
  const block=el("div","sources");
  for(const x of (items||[]).slice(0,5)){
   const a=sourceLink(x.url);if(a)block.append(a);
   if(x.reason)block.append(el("p","empty",x.reason));
  }
  if(!items?.length)block.append(el("p","empty","None identified by this stage."));
  slot.append(block);
 }
 slot.append(el("h4","","Third-party discrepancy investigations"));
 const cases=report.thirdPartyCandidates||[];
 if(!cases.length){
  slot.append(el("p","empty","No sufficiently anchored, cross-source discrepancy candidate surfaced. This does not prove the records are accurate."));
 }else{
  for(const candidate of cases){
   const caseCard=el("div","gap");
   caseCard.append(el("strong","",candidate.platform?.toUpperCase()+" · NEEDS LIVE FACT CHECK"));
   caseCard.append(el("p","",candidate.currentStatement));
   caseCard.append(el("p","",candidate.conflictingStatement));
   caseCard.append(el("p","",candidate.proposedAction));
   const source=sourceLink(candidate.recordUrl);
   if(source)caseCard.append(source);
   const copy=el("button","run-person","Copy evidence-based contributor brief");
   copy.type="button";
   copy.addEventListener("click",async()=>{
    try{
     const brief=draftImdbContributorBrief(candidate);
     await navigator.clipboard.writeText(brief);
     copy.textContent="Copied · Review before submitting";
    }catch(error){copy.textContent="Copy unavailable · "+String(error.message||"review required").slice(0,65);}
   });
   if(candidate.platform==="imdb")caseCard.append(copy);
   caseCard.append(el("p","tag","SYSTEM-DETECTED CANDIDATE · NOT SUBMITTED"));
   slot.append(caseCard);
  }
 }
 slot.append(el("h4","","Owned-website potential gaps"));
 if(!report.opportunities.length){
  slot.append(el("p","empty","No observed owned-website gap from this scan. Third-party discrepancies appear separately above."));
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
async function savePersonGraph(id,button){
 const data=state[id],person=PILOT_COHORT.find(p=>p.id===id);
 if(!data.graph){status("Run an audit before saving "+person.name+".");return;}
 button.disabled=true;status("Saving "+person.name+"'s graph and maintenance snapshot to your private Ulab account…");
 try{
  await saveGraphToAccount(data.graph,data.comparison);
  status("Saved "+person.name+"'s evidence graph privately. No public records were edited.");
 }catch(e){status("Account save unavailable: "+String(e.message||"unknown error").slice(0,180));}
 finally{button.disabled=false;}
}
async function restorePersonGraph(id,button){
 const person=PILOT_COHORT.find(p=>p.id===id),data=state[id];
 button.disabled=true;status("Loading "+person.name+"'s private graph…");
 try{
  const record=await loadGraphFromAccount(id);
  if(!record){status("No account graph exists for "+person.name+".");return;}
  if(record.graph.subject?.id!==id)throw Error("Saved identity belongs to a different participant.");
  data.graph=record.graph;data.comparison=compareIdentityGraphs(null,data.graph);
  if(!persist())throw Error("Browser storage is unavailable.");
  renderPeople();status("Restored "+person.name+"'s graph. Rerun the audit to compare against the saved baseline.");
 }catch(e){status("Account restore unavailable: "+String(e.message||"unknown error").slice(0,180));}
 finally{button.disabled=false;}
}
function renderPeople(){
 const holder=$("people");holder.replaceChildren();
 for(const [i,person] of PILOT_COHORT.entries()){
  const data=state[person.id],card=el("article","person");
  card.dataset.personId=person.id;
  const head=el("div","person-head"),nameGroup=el("div"),badge=el("span","status"+(data.error?" error":data.report&&["ok","partial"].includes(data.report.researchStatus)?" completed":""),
   data.loading?"RUNNING":data.error?"ERROR":data.report&&["ok","partial"].includes(data.report.researchStatus)?"AUDITED":data.report?"INCOMPLETE":"NOT SCANNED");
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
  const save=el("button","run-person","Save graph privately");
  save.type="button";save.disabled=running||!data.graph;
  save.addEventListener("click",()=>savePersonGraph(person.id,save));
  const restore=el("button","run-person","Restore graph");
  restore.type="button";restore.disabled=running;
  restore.addEventListener("click",()=>restorePersonGraph(person.id,restore));
  if(accountEnabled)foot.append(save,restore);
  foot.append(run,el("span","person-count",data.loading?"Scanning public sources…":data.error?data.error:data.report&&data.report.researchStatus==="not_configured"?"Web search was unavailable":data.report?"Last scanned "+new Date(data.report.generatedAt).toLocaleDateString():"Research not started"));
  card.append(foot);
  renderIdentityGraph(card,data.graph,data.comparison);
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
  if(report.researchStatus==="not_configured")throw Error("Web search is not configured on this preview. This is not a complete audit.");
  // System-owned identity graph and monitoring comparison from the live discovery response.
  const graph=buildIdentityGraph({personId,name:person.name,link:normalized,discovery:result});
  const comparison=compareIdentityGraphs(data.graph,graph);
  data.graph=graph;data.comparison=comparison;data.report=report;
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
  status("Research finished for "+person.name+". "+report.counts.sourceLeads+" public leads; "+((report.counts.thirdPartyCandidates||0)+report.counts.potentialGaps)+" candidates for review. No edits made.");
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
 const reports=PILOT_COHORT.map(person=>({participant:person.name,report:state[person.id].report,graph:state[person.id].graph,maintenance:state[person.id].comparison})),
  data={program:"Ulab four-person system validation",createdAt:new Date().toISOString(),
   cohort:PILOT_COHORT.map(person=>person.name),scans:reports,
   correctionsPerformed:0,verificationPerformed:0,graphSchemaVersion:1,
   note:"System-generated identity graph snapshots. Matches unverified; no external edits or account access."};
 const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"})),
  link=el("a");link.href=url;link.download="ulab-four-person-pilot.json";
 document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
$("run-all").addEventListener("click",startAll);
$("export").addEventListener("click",exportReports);
renderPeople();
fetch("/api/identity-config",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(config=>{
 accountEnabled=!!(config?.enabled);
 $("pilot-account").hidden=!accountEnabled;
 renderPeople();
}).catch(()=>{accountEnabled=false;$("pilot-account").hidden=true;});
