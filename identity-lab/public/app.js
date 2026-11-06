(()=>{
 "use strict";
 const $=id=>document.getElementById(id),form=$("identity-form"),panels=["home-screen","search-screen","report-screen"];
 let report=null,category="overview",items=[],fixes=[],abort=null,scanClock=null,scanStart=0,currentRepair=null,packet=null;
 const $new=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=String(txt);return n;};
 const host=url=>{try{return new URL(url).hostname.replace(/^www[.]/,"").toLowerCase();}catch{return "";}};
 const safeLink=(url,label)=>{try{const u=new URL(url);if(u.protocol!=="https:")return null;const a=$new("a","source-link",label||u.hostname);a.href=u.href;a.target="_blank";a.rel="noopener noreferrer";return a;}catch{return null;}};
 const screen=id=>{panels.forEach(s=>$(s).hidden=s!==id);window.scrollTo({top:0,behavior:"instant"});};
 function showToast(msg){const n=$("toast");n.textContent=msg;n.classList.add("visible");clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>n.classList.remove("visible"),3500);}
 function toHttps(value){const v=value.trim();if(!v)return "";return /^https?:\/\//i.test(v)?v:"https://"+v;}
 function classify(item,source){
  const h=host(item.url);let type="coverage",platform="website";
  if(source==="wikidata"||/(^|[.])(wikidata[.]org|wikipedia[.]org|openalex[.]org)$/.test(h)){type="knowledge";platform=h.includes("wikidata")?"wikidata":h.includes("wikipedia")?"wikipedia":"other";}
  else if(/(^|[.])(linkedin[.]com|imdb[.]com|themoviedb[.]org|instagram[.]com|facebook[.]com|x[.]com|twitter[.]com|tiktok[.]com|youtube[.]com|vimeo[.]com|github[.]com|behance[.]net|orcid[.]org)$/.test(h)){
   type="profiles";platform=h.includes("imdb")?"imdb":h.includes("themoviedb")?"tmdb":h.includes("linkedin")?"linkedin":"other";
  }
  return {...item,type,platform,host:h,source,connection:item.connection|| (item.status==="cross_linked"?"linked":"unverified"),title:item.title||item.label||h||"Public record"};
 }
 function buildItems(data){
  const combined=[...(data.candidates?.web||[]).map(x=>classify(x,"web")),...(data.candidates?.wikidata||[]).map(x=>classify(x,"wikidata"))];
  const seen=new Set();
  return combined.filter(x=>{if(!x.url||seen.has(x.url))return false;seen.add(x.url);return true;}).sort((a,b)=>(b.score||0)-(a.score||0));
 }
 function route(item){
  if(item.platform==="imdb")return {label:"IMDb contributor correction",description:"Prepare a fact-specific contribution request for the existing IMDb name record. Sign-in and submission require an authorized contributor."};
  if(item.platform==="tmdb")return {label:"TMDb contributor correction",description:"Prepare an edit for a verified existing person page. Submission requires an authorized contributor account."};
  if(item.platform==="wikidata")return {label:"Sourced Wikidata review",description:"Review the exact Wikidata statement and cite appropriate published sources. Follow disclosure requirements for paid contributions."};
  if(item.platform==="wikipedia")return {label:"Neutral Wikipedia edit request",description:"Use an existing article talk page, an independent source, and a conflict-of-interest disclosure. Article creation is not included."};
  if(item.platform==="linkedin")return {label:"Owner-only LinkedIn update",description:"Prepare clear wording, then the profile owner must make the change through their account."};
  if(item.platform==="website")return {label:"Owner-approved website correction",description:"Prepare a specific change and apply it only on a website you own or have explicit permission to manage."};
  return {label:"Publisher or profile-owner request",description:"We can prepare a factual request, but this source has no authorized edit integration. Contact the publisher or account owner through its official process."};
 }
 function buildFixes(){
  const actions=(report.results||[]).filter(x=>x.status==="action"&&x.recommendation).map(x=>({
   title:x.title,detail:x.detail,action:x.recommendation,url:x.url||report.subject.link,type:"site",platform:"website",
   route:"Website owner action",supported:!!report.site?.ok}));
  return actions;
 }
 function evidenceScore(data,found){
  // Observed, capped connection evidence, not a prediction of notability or Google panels.
  // No website anchor or linked sources means we do not have enough data to score.
  const website=!!data.subject?.link;
  const search=data.webResearch?.status==="ok"||data.webResearch?.status==="partial";
  const anchors=found.filter(x=>x.connection==="anchor"||x.connection==="linked"||x.status==="cross_linked").length;
  const cross=found.filter(x=>x.connection==="strong_candidate").length;
  const diversity=new Set(found.filter(x=>["linked","anchor","strong_candidate"].includes(x.connection)).map(x=>x.host)).size;
  const eligible=website&&search;
  if(!eligible)return {value:null,anchor:anchors,diversity,explanation:"Not enough connected sources to calculate a meaningful score."};
  const value=Math.min(100,Math.round(Math.min(anchors,4)*14+Math.min(diversity,4)*8+Math.min(cross,3)*4));
  return {value,anchor:anchors,diversity,explanation:"Based only on observed website links, source connections and supporting mentions in this scan. Not a Google rating or Knowledge Panel probability."};
 }
 const tabs={
  overview:["01 / OVERVIEW","The whole picture.","The strongest source connections and the most useful next steps."],
  profiles:["02 / PROFILES","Your public profiles.","Potential professional and social records. Confirm which belong to you."],
  coverage:["03 / ARTICLES & MENTIONS","Where you're mentioned.","Pages and publications found in broad-web search. Results may include namesakes."],
  knowledge:["04 / KNOWLEDGE RECORDS","Public knowledge sources.","Wikidata and similar public records, where established entries can help connect identifiers."],
  fixes:["05 / FIX CENTER","Make the record clearer.","Prepare a source-specific correction, then follow the legitimate submission route."]
 };
 function card(item){
  const c=$new("article","result-card");
  const head=$new("div","result-head"),stamp=$new("span","result-type",item.type==="profiles"?"PROFILE":item.type==="knowledge"?"KNOWLEDGE RECORD":"PUBLIC MENTION");
  const relation=$new("span","relation "+(item.connection==="linked"||item.connection==="anchor"?"connected":"candidate"),item.connection==="anchor"?"STARTING LINK":item.connection==="linked"?"WEBSITE-LINKED":item.connection==="strong_candidate"?"WEBSITE MENTION":"POSSIBLE MATCH");
  head.append(stamp,relation);c.append(head,$new("h3","",item.title));
  if(item.description)c.append($new("p","result-desc",item.description.slice(0,320)));
  if(item.reasons?.length)c.append($new("p","result-reason",item.reasons.join(" · ")));
  const foot=$new("div","result-foot"),source=safeLink(item.url,"VIEW SOURCE ↗");if(source)foot.append(source);
  const decision=report.review?.[item.url]?.decision;
  const confirm=$new("button","confirm-button "+(decision==="self_reported_match"?"selected":""),decision==="self_reported_match"?"✓ MINE":"THIS IS ME");
  confirm.type="button";confirm.addEventListener("click",()=>{report.review=report.review||{};report.review[item.url]={decision:"self_reported_match",basis:"customer_self_report_only",reviewedAt:new Date().toISOString()};showToast("Marked as your record. Independent verification may still be required.");renderTab();});
  const reject=$new("button","reject-button "+(decision==="self_reported_not_match"?"selected":""),decision==="self_reported_not_match"?"✓ NOT MINE":"NOT ME");
  reject.type="button";reject.addEventListener("click",()=>{report.review=report.review||{};report.review[item.url]={decision:"self_reported_not_match",basis:"customer_self_report_only",reviewedAt:new Date().toISOString()};renderTab();});
  foot.append(confirm,reject);
  const edit=$new("button","mini-fix","PREPARE FIX ↗");edit.type="button";edit.addEventListener("click",()=>openCorrection(item));foot.append(edit);
  c.append(foot);return c;
 }
 function infoCard(title,desc,tag){
  const c=$new("div","insight-card");c.append($new("span","insight-kicker",tag),$new("h3","",title),$new("p","",desc));return c;
 }
 function fixCard(f){
  const c=$new("article","fix-card");c.append($new("span","fix-tag",f.supported?"WEBSITE ACTION":"REVIEW REQUIRED"),$new("h3","",f.title),$new("p","",f.action));
  const footer=$new("div","fix-card-foot"),source=safeLink(f.url,"SOURCE ↗");if(source)footer.append(source);
  const button=$new("button","mini-fix","PREPARE CORRECTION ↗");button.type="button";button.addEventListener("click",()=>openCorrection({url:f.url,type:"site",platform:"website",title:f.title,description:f.detail}));
  footer.append(button);c.append(footer);return c;
 }
 function activateTab(id){category=id;document.querySelectorAll("[data-tab]").forEach(b=>{const active=b.dataset.tab===id;b.classList.toggle("active",active);b.setAttribute("aria-selected",active?"true":"false");});renderTab();}
 function renderTab(){
  const holder=$("tab-content");holder.replaceChildren();
  const [kicker,title,desc]=tabs[category];$("tab-kicker").textContent=kicker;$("tab-title").textContent=title;$("tab-description").textContent=desc;
  const filtered=category==="overview"?[]:category==="fixes"?[]:items.filter(x=>x.type===category&&report.review?.[x.url]?.decision!=="self_reported_not_match");
  if(category==="overview"){
   const research=report.webResearch||{},score=evidenceScore(report,items);
   const intro=$new("div","insight-grid");
   intro.append(
    infoCard("A search, not an identity verdict",(research.queryCount||0)+" web searches completed, "+items.length+" distinct source leads found. Results require a human identity check.","RESEARCH SCOPE"),
    infoCard("What connects",score.anchor+" source(s) linked through the provided website or published identifiers. Others remain candidate matches.","CROSS-SOURCE EVIDENCE"),
    infoCard("Knowledge Panel: not verified","An identity score does not determine whether Google will show a panel. Independent coverage, verified records, and Google's own systems matter.","GOOGLE STATUS")
   );
   holder.append(intro);
   const rec=$new("div","section-divide");rec.append($new("h3","","Your strongest leads"),$new("span","",items.length+" records"));holder.append(rec);
   const selected=items.filter(x=>report.review?.[x.url]?.decision!=="self_reported_not_match").slice(0,6);
   if(!selected.length)holder.append(infoCard("No suitable matches surfaced","Try adding a public identity link, or search again. This doesn't mean the person has no online footprint.","NO RESULTS"));
   selected.forEach(x=>holder.append(card(x)));
   const next=$new("div","section-divide");next.append($new("h3","","Where to begin"));holder.append(next);
   if(fixes.length){fixes.slice(0,3).forEach(x=>holder.append(fixCard(x)));}
   else holder.append(infoCard("Verify one important record first","Open a likely professional profile, mark it as yours, and prepare a factual correction if you find a real discrepancy.","NEXT STEP"));
  }else if(category==="fixes"){
   const actions=$new("div","insight-grid");
   actions.append(infoCard("Corrections, not cosmetic SEO","We prepare changes for a specific record. We won't invent an error or promise a third-party edit was accepted.","OUR APPROACH"),
    infoCard("Account permissions still matter","IMDb and TMDb allow contributor workflows; LinkedIn is owner-only; Wikimedia has evidence and disclosure rules.","HOW IT WORKS"));
   holder.append(actions);
   if(fixes.length){const h=$new("div","section-divide");h.append($new("h3","","Website opportunities"));holder.append(h);fixes.forEach(f=>holder.append(fixCard(f)));}
   const h=$new("div","section-divide");h.append($new("h3","","Find a record to correct"));holder.append(h);
   const claimed=items.filter(x=>report.review?.[x.url]?.decision==="self_reported_match");
   (claimed.length?claimed:items.filter(x=>x.type==="profiles"||x.type==="knowledge").slice(0,8)).forEach(x=>holder.append(card(x)));
   if(!fixes.length&&!items.length)holder.append(infoCard("No verified discrepancy","We need a real record and supporting facts before we can prepare a meaningful correction.","NOTHING TO FIX YET"));
   const a=$new("a","correction-center-link","OPEN EXISTING CORRECTION CENTER ↗");a.href="/workspace/operations";holder.append(a);
  }else{
   $("tab-counter").textContent=filtered.length+" SOURCES";
   if(!filtered.length)holder.append(infoCard("No records in this category","Search visibility depends on the available sources and name ambiguity. This is not proof that none exist.","NO MATCHES"));
   filtered.forEach(x=>holder.append(card(x)));
  }
  if(category==="overview"||category==="fixes")$("tab-counter").textContent=category==="fixes"?fixes.length+" WEBSITE OPPORTUNITIES":items.length+" SOURCE LEADS";
 }
 function renderReport(data){
  report=data;report.review=report.review||{};items=buildItems(data);fixes=buildFixes();const score=evidenceScore(data,items);
  $("report-subtitle").textContent=data.subject.name+" · "+(data.subject.link||"Name-only research");
  $("report-date").textContent=new Date(data.generatedAt).toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"}).toUpperCase();
  $("connection-score").textContent=score.value===null?"—":score.value;
  $("score-title").textContent=score.value===null?"Insufficient evidence":"Observed evidence / 100";
  $("score-explanation").textContent=score.explanation;
  $("score-gauge").style.setProperty("--score",score.value===null?"0%":score.value+"%");
  $("profile-count").textContent=items.filter(x=>x.type==="profiles").length;
  $("coverage-count").textContent=items.filter(x=>x.type==="coverage").length;
  $("knowledge-count").textContent=items.filter(x=>x.type==="knowledge").length;
  $("count-profiles").textContent=items.filter(x=>x.type==="profiles").length;
  $("count-coverage").textContent=items.filter(x=>x.type==="coverage").length;
  $("count-knowledge").textContent=items.filter(x=>x.type==="knowledge").length;
  $("count-fixes").textContent=fixes.length;
  const research=data.webResearch||{};
  $("coverage-status").textContent=research.status==="ok"?"WEB SEARCH ACTIVE":research.status==="partial"?"PARTIAL COVERAGE":research.status==="not_configured"?"WEB SEARCH DISCONNECTED":"SEARCH LIMITED";
  $("coverage-note").textContent=(research.queryCount||0)+" queries · "+items.length+" public leads";
  screen("report-screen");activateTab("overview");
 }
 function stageAnimation(){
  const elapsed=Date.now()-scanStart,stage=elapsed<1250?0:elapsed<2600?1:2;
  const stages=["Searching public identity records…","Looking for professional profiles and published mentions…","Comparing public links and building your report…"];
  $("search-message").textContent=stages[stage];
  document.querySelectorAll("[data-stage]").forEach(x=>{x.classList.toggle("active",Number(x.dataset.stage)===stage);x.classList.toggle("complete",Number(x.dataset.stage)<stage);});
 }
 function finishScan(data){
  clearInterval(scanClock);scanClock=null;abort=null;renderReport(data);
 }
 function cancelScan(){if(abort)abort.abort();abort=null;clearInterval(scanClock);scanClock=null;$("run-button").disabled=false;screen("home-screen");}
 form.addEventListener("submit",async event=>{
  event.preventDefault();
  const name=$("person-name").value.trim(),link=toHttps($("site-url").value);
  if(name.length<2){$("form-message").textContent="Enter your professional name.";return;}
  $("form-message").textContent="";$("run-button").disabled=true;
  $("search-subject").textContent=name;scanStart=Date.now();screen("search-screen");stageAnimation();scanClock=setInterval(stageAnimation,400);
  const controller=new AbortController();abort=controller;const timeout=setTimeout(()=>controller.abort(),35000);
  try{
   const response=await fetch("/api/discover",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,link}),signal:controller.signal});
   const result=await response.json();if(!response.ok)throw new Error(result.error||"Research request failed.");
   if(controller!==abort)return;
   // A short minimum display gives the real phases time to register, without a misleading long delay.
   const elapsed=Date.now()-scanStart;if(elapsed<2000)await new Promise(resolve=>setTimeout(resolve,2000-elapsed));
   if(controller!==abort)return;finishScan(result);
  }catch(error){if(controller!==abort)return;clearInterval(scanClock);scanClock=null;abort=null;screen("home-screen");$("form-message").textContent=error.name==="AbortError"?"The search timed out. Try again.":String(error.message||"Search failed.");}
  finally{clearTimeout(timeout);$("run-button").disabled=false;}
 });
 $("cancel-scan").addEventListener("click",cancelScan);
 $("new-scan").addEventListener("click",()=>screen("home-screen"));
 $("home-logo").addEventListener("click",event=>{event.preventDefault();if(abort)cancelScan();screen("home-screen");});
 document.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>activateTab(b.dataset.tab)));
 $("fix-button").addEventListener("click",()=>activateTab("fixes"));
 const dlg=$("fix-dialog");
 function openCorrection(item){
  currentRepair=item;packet=null;$("correction-form").reset();$("packet-output").hidden=true;
  const kind=route(item);$("dialog-title").textContent=kind.label;$("dialog-kicker").textContent=(item.host||host(item.url)).toUpperCase();
  const context=$("dialog-context");context.replaceChildren($new("strong","",item.title||"Public record"),$new("p","",kind.description));
  const a=safeLink(item.url,"OPEN CURRENT RECORD ↗");if(a)context.append(a);
  $("dialog-hint").textContent="Use an actual fact-based discrepancy. A suggested correction is not submitted automatically.";
  if(item.type==="site"){$("current-text").value=(item.description||"Missing or inaccurate public identity information").slice(0,1000);}
  else if(item.description)$("current-text").placeholder="Verify the current wording on "+(item.host||"the public record")+" before drafting.";
  if(typeof dlg.showModal==="function")dlg.showModal();else dlg.setAttribute("open","");
 }
 $("close-dialog").addEventListener("click",()=>dlg.close());
 dlg.addEventListener("click",e=>{if(e.target===dlg)dlg.close();});
 function recordPlatform(item){
  return ["imdb","tmdb","wikipedia","wikidata","linkedin"].includes(item.platform)?item.platform:"website";
 }
 $("correction-form").addEventListener("submit",async e=>{
  e.preventDefault();if(!currentRepair||!report)return;
  const current=$("current-text").value.trim(),desired=$("desired-text").value.trim(),evidence=$("evidence-url").value.trim();
  if(current.length<3||desired.length<3||current.toLowerCase()===desired.toLowerCase()){$("dialog-hint").textContent="Enter different, specific current and desired facts.";return;}
  const platform=recordPlatform(currentRepair),link=currentRepair.url||report.subject.link;
  let task=null,packetText="";
  try{
   if(platform==="website"&&currentRepair.platform!=="website")throw Error("Use manual publisher correction route.");
   const engine=await import("/identity-engine.mjs");
   const data={subject:report.subject.name,platform,profileUrl:link,current,desired,evidence:evidence?[{url:evidence,kind:"unclassified",label:"Customer-supplied supporting source"}]:[]};
   task=engine.makeTask(data);
   packetText=engine.makePacket(task,{serviceName:"Ulab",clientName:report.subject.name});
  }catch(error){
   // For platforms not yet integrated with our correction engine, produce a manual evidence request only.
   if(platform==="website"&&currentRepair.platform!=="website"){
    packetText="PUBLISHER / PROFILE OWNER REQUEST — REVIEW ONLY\n\nPERSON: "+report.subject.name+"\nPUBLIC RECORD: "+link+"\nCURRENT STATEMENT: "+current+"\nREQUESTED FACTUAL CORRECTION: "+desired+"\nSUPPORTING SOURCE: "+(evidence||"Missing: add a reputable published source")+"\n\nPlease review the factual discrepancy and cited evidence and correct it under your platform policies.\n\nDRAFT ONLY. No account was accessed and no request submitted. Contact the publisher or profile owner through the official channel.";
   }else{$("dialog-hint").textContent=error.message||"Unable to prepare this packet.";return;}
  }
  packet={text:packetText,task};$("packet-text").textContent=packetText;$("packet-output").hidden=false;
  $("save-packet").disabled=!task;
  $("packet-status").textContent=task?.missing?.length?"Draft ready. Evidence needed: "+task.missing.join(" "):"Draft ready for review. No changes or submissions have been made.";
 });
 $("copy-packet").addEventListener("click",async()=>{if(!packet)return;try{await navigator.clipboard.writeText(packet.text);$("packet-status").textContent="Correction packet copied. Nothing has been submitted.";}catch{$("packet-status").textContent="Copy unavailable. Select the packet text manually.";}});
 $("save-packet").addEventListener("click",()=>{
  if(!packet?.task)return;
  try{
   const key="identitylab.operations.v2",saved=JSON.parse(localStorage.getItem(key)||"[]");
   if(!Array.isArray(saved)||saved.length>=100)throw Error("Local queue is full.");
   saved.unshift(packet.task);localStorage.setItem(key,JSON.stringify(saved));
   $("packet-status").textContent="Saved locally to the correction center. No platform edit has been submitted.";
  }catch(e){$("packet-status").textContent=e.message||"Unable to save draft.";}
 });
 $("download-report").addEventListener("click",()=>{
  if(!report)return;const data={...report,sourceReview:report.review,observedEvidenceScore:evidenceScore(report,items)};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=$new("a");a.href=url;a.download="ulab-"+report.subject.name.toLowerCase().replace(/[^a-z0-9]+/g,"-")+"-report.json";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
 screen("home-screen");
})();