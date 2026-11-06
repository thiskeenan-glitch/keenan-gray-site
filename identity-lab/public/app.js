(()=> {
 const $=id=>document.getElementById(id);
 const form=$("audit-form"),submit=$("run-button"),message=$("form-message"),results=$("results");
 let current=null;
 const statuses={pass:"FOUND",action:"ACTION",manual:"REVIEW",unknown:"UNKNOWN"};
 const marks={pass:"✓",action:"!",manual:"↗",unknown:"?"};
 const elt=(tag,cls,value)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(value!==undefined&&value!==null)node.textContent=String(value);return node;};
 const link=(url,label)=>{
  try{const parsed=new URL(url);if(parsed.protocol!=="https:")return null;
   const a=elt("a","finding-source",label);a.href=parsed.href;a.target="_blank";a.rel="noopener noreferrer";return a;}catch{return null;}
 };
 function drawFinding(item){
  const outer=elt("div","finding"),mark=elt("span","finding-marker "+item.status,marks[item.status]||"?");
  mark.setAttribute("aria-hidden","true");
  const body=elt("div","finding-body"),top=elt("div","finding-top");
  top.append(elt("strong","finding-title",item.title),elt("span","finding-pill "+item.status,statuses[item.status]||"CHECK"));
  body.append(top,elt("p","finding-detail",item.detail));
  const a=link(item.url,"SEE SOURCE ↗");if(a)body.append(a);
  outer.append(mark,body);return outer;
 }
 async function addDraft(opportunity,button){
   button.disabled=true;
   try{
     const {makeTask}=await import("/identity-engine.mjs");
     const task=makeTask({
       subject:opportunity.subject,platform:opportunity.platform,profileUrl:opportunity.profileUrl,
       current:opportunity.current,desired:opportunity.desired,evidence:opportunity.evidence
     });
     // The source labels do not imply independent corroboration. Wikimedia tasks remain gated.
     if(task.status!=="needs_evidence")throw new Error("This suggestion must require independent evidence before review.");
     const key="identitylab.operations.v2";
     const saved=JSON.parse(localStorage.getItem(key)||"[]");
     if(!Array.isArray(saved)||saved.length>=100)throw new Error("The local correction queue is full or invalid.");
     if(saved.some(t=>t.originReviewId===opportunity.id&&t.subject===opportunity.subject)){
       button.textContent="ALREADY IN CORRECTION CENTER";return;
     }
     saved.unshift({...task,originReviewId:opportunity.id,originBasis:opportunity.basis,
       sourceFinding:"Customer self-reported identity match; independent evidence not established; no edit submitted."});
     localStorage.setItem(key,JSON.stringify(saved));
     button.textContent="REVIEW DRAFT ADDED ✓";
   }catch(e){button.disabled=false;button.textContent="UNABLE TO ADD: "+String(e.message||e).slice(0,100);}
 }
 async function drawOpportunities(){
   const panel=$("repair-review"),holder=$("repair-list");
   if(!panel||!current)return;
   holder.replaceChildren();panel.hidden=true;
   try{
     const {draftOpportunities}=await import("/repair-opportunities.mjs");
     const selected=draftOpportunities(current,{reviews:current.review||{}});
     if(!selected.length)return;
     panel.hidden=false;
     for(const item of selected){
       const card=elt("article","repair-card");
       const headline=elt("h4","",item.discrepancyType==="possibly_missing_official_site"?"POSSIBLE MISSING OFFICIAL WEBSITE":"POSSIBLE OUTDATED WEBSITE RECORD");
       card.append(headline,elt("p","",item.current),elt("p","",item.caveat));
       const view=link(item.profileUrl,"SEE PUBLIC WIKIDATA RECORD ↗");if(view)card.append(view);
       const button=elt("button","repair-add","ADD REVIEW DRAFT TO CORRECTION CENTER");
       button.type="button";button.addEventListener("click",()=>addDraft(item,button));
       card.append(button);holder.append(card);
     }
   }catch(e){console.warn("Repair review unavailable",e);}
 }
 function drawCandidate(item,source){
  const card=elt("article","candidate-card"),meta=elt("span","candidate-meta",source+" / "+(item.status==="cross_linked"?"IDENTIFIER CONNECTION":"UNVERIFIED CANDIDATE"));
  const title=elt("h4","",item.label||item.title||"Public record");
  card.append(meta,title);
  if(item.description)card.append(elt("p","",item.description));
  const a=link(item.url,"REVIEW PUBLIC SOURCE ↗");if(a)card.append(a);
  const choices=elt("div","candidate-choices");
  const decision=elt("span","candidate-decision","");
  for(const [value,label] of [["self_reported_match","THIS IS ME"],["self_reported_not_match","NOT ME"]]){
   const button=elt("button","candidate-choice",label);button.type="button";
   button.addEventListener("click",()=>{
    if(!current)return;
    current.review=current.review||{};
    current.review[item.url]={decision:value,reviewedAt:new Date().toISOString(),basis:"customer_self_report_only"};
    decision.textContent=value==="self_reported_match"?"Customer identified this as their record. Independent verification still required.":"Customer marked as a different person.";
    drawOpportunities();
   });
   choices.append(button);
  }
  card.append(choices,decision);
  if(current?.review?.[item.url]){
   decision.textContent=current.review[item.url].decision==="self_reported_match"?"Customer identified this as their record. Independent verification still required.":"Customer marked as a different person.";
  }
  return card;
 }
 function render(report){
  current=report;
  results.hidden=false;
  $("report-subtitle").textContent=report.subject.name+" · "+(report.subject.link||"Name-only scan")+" · Preliminary public-source audit";
  $("check-count").textContent=String(report.results.length);
  $("pass-count").textContent=String(report.summary.pass);
  $("action-count").textContent=String(report.summary.action);
  $("manual-count").textContent=String(report.summary.manual+report.summary.unknown);
  $("findings-total").textContent=report.results.length+" FINDINGS";
  $("report-date").textContent="SCAN GENERATED "+new Date(report.generatedAt).toLocaleString(undefined,{dateStyle:"medium",timeStyle:"short"}).toUpperCase();
  $("findings-list").replaceChildren(...report.results.map(drawFinding));
  const candidates=$("candidate-list");candidates.replaceChildren();
  const wikidata=report.candidates?.wikidata||[],web=report.candidates?.web||[];
  for(const item of wikidata)candidates.append(drawCandidate(item,"WIKIDATA"));
  for(const item of web)candidates.append(drawCandidate(item,"WEB SEARCH"));
  if(!wikidata.length&&!web.length)candidates.append(elt("p","candidate-intro","No public matches could be confidently proposed from the available sources. This is not evidence that none exist."));
  drawOpportunities();
  const list=$("priority-list");list.replaceChildren();
  for(const item of report.priority||[]){
   const li=elt("li"),inner=elt("div");
   inner.append(elt("strong","",item.title),elt("p","",item.description));
   const a=link(item.source,"SEE EVIDENCE ↗");if(a)inner.append(a);
   li.append(inner);list.append(li);
  }
  if(!list.children.length)list.append(elt("p","empty-note","No actionable corrections could be demonstrated. Verify the public records before proposing edits."));
  $("ai-note").hidden=true;
  results.scrollIntoView({behavior:"smooth",block:"start"});
 }
 form.addEventListener("submit",async event=>{
  event.preventDefault();
  const name=$("person-name").value.trim(),linkValue=$("site-url").value.trim();
  message.classList.remove("error");
  if(name.length<2){message.textContent="Enter your professional name.";return;}
  submit.disabled=true;$("button-label").textContent="DISCOVERING PUBLIC RECORDS…";
  message.textContent="Checking supported public knowledge sources. Potential matches will require verification.";
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),25000);
  try{
   const response=await fetch("/api/discover",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,link:linkValue}),signal:controller.signal});
   const body=await response.json();
   if(!response.ok)throw new Error(body.error||"The scan failed.");
   render(body);
   message.textContent="Preliminary audit complete. "+(body.candidates?.wikidata?.length||0)+" exact-name knowledge candidates and "+(body.candidates?.web?.length||0)+" web candidates. Review before claiming any match.";
  }catch(e){message.classList.add("error");message.textContent=e.name==="AbortError"?"Discovery timed out. Try again.":String(e.message||"Audit failed.");}
  finally{clearTimeout(timer);submit.disabled=false;$("button-label").textContent="START AUDIT";}
 });
 $("copy-report").addEventListener("click",async()=>{
  if(!current)return;
  const lines=["IDENTITY LAB PRELIMINARY AUDIT",current.subject.name,"Starting link: "+(current.subject.link||"None"),"Generated: "+current.generatedAt,
   "",...current.results.map(x=>x.title+": "+x.detail),"","NEXT STEPS",...current.priority.map(x=>x.title+" — "+x.description),"",current.disclaimer];
  try{await navigator.clipboard.writeText(lines.join("\n"));$("copy-report").textContent="COPIED ✓";}
  catch{$("copy-report").textContent="COPY UNAVAILABLE";}
  setTimeout(()=>$("copy-report").textContent="COPY ACTIONS ↗",1800);
 });
 $("download-report").addEventListener("click",()=>{
  if(!current)return;
  const blob=new Blob([JSON.stringify(current,null,2)],{type:"application/json"});
  const object=URL.createObjectURL(blob),a=elt("a");a.href=object;
  a.download="identity-lab-"+current.subject.name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")+"-audit.json";
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(object),1000);
 });
})();