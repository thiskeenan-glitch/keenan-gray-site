// Ulab Repair Pilot: field-specific public checks and browser-local before/after evidence.
// This code does not edit websites, submit corrections, or claim that Ulab caused a change.
(()=>{
 "use strict";
 const $=id=>document.getElementById(id);
 const STORE="identitylab.publicProof.v1";
 const fields={
  website:[["heading","Visible page headline (H1)"],["title","Page title"],["person_name","Structured Person name"],["same_as","Structured Person sameAs link"]],
  wikidata:[["official_website","Official website (P856)"],["imdb_id","IMDb person ID (P345)"],["tmdb_person_id","TMDb person ID (P4985)"]]
 };
 let context=null;
 const make=(tag,cls,txt)=>{const element=document.createElement(tag);if(cls)element.className=cls;if(txt!==undefined)element.textContent=String(txt);return element;};
 const safeLink=(url,label)=>{try{const source=new URL(url);if(source.protocol!=="https:")return null;const link=make("a","source-link",label);link.href=source.href;link.target="_blank";link.rel="noopener noreferrer";return link;}catch{return null;}};
 function readStore(){
  try{const store=JSON.parse(localStorage.getItem(STORE)||"{}");return store&&typeof store==="object"&&!Array.isArray(store)?store:{};}
  catch{return {};}
 }
 function caseKey(){
  if(!context)return "";
  return JSON.stringify([context.subject.trim().toLowerCase(),context.platform,$("proof-url").value.trim(),$("proof-field").value,$("proof-expected").value.trim()]);
 }
 function activeRecord(){
  const store=readStore(),key=caseKey();
  const record=store[key];
  return record&&Array.isArray(record.checks)?record:null;
 }
 function stringifyValues(values){
  return Array.isArray(values)&&values.length?values.slice(0,6).join(" | "):"No matching field values found";
 }
 function appendCheck(title,check,holder){
  if(!check)return;
  const card=make("div","proof-check-card");
  card.append(make("strong","",title+" · "+(check.status==="verified_public"?"VALUE VISIBLE":"VALUE NOT VISIBLE")));
  card.append(make("small","",new Date(check.checkedAt).toLocaleString()));
  card.append(make("p","",stringifyValues(check.observed)));
  holder.append(card);
 }
 function renderHistory(){
  const holder=$("proof-history");holder.replaceChildren();
  const record=activeRecord();
  if(!record||!record.checks?.length){
   holder.append(make("p","proof-empty","No baseline yet. Run the first check before making a correction, then check again to compare."));
   return;
  }
  const first=record.checks[0],latest=record.checks[record.checks.length-1];
  let title="Baseline captured",detail="This only establishes what is visible publicly.";
  if(first.status==="verified_public"){
   title="Already publicly visible at baseline";
   detail="This cannot be counted as a new correction, even if later checks also find it.";
  }else if(first.status==="not_visible"&&latest.status==="verified_public"){
   title="Public change observed since baseline";
   detail="The expected public value was absent during the first check and present on a later check. This does not establish who made the change.";
  }else if(record.checks.some(x=>x.status==="verified_public")&&latest.status==="not_visible"){
   title="Previously visible value not found now";
   detail="The visible value may have been reverted or the source may have changed. Review the record.";
  }else if(first.status==="not_visible"){
   title="Expected value not yet visible";
   detail="The current public source does not show this exact value in the inspected field.";
  }
  holder.append(make("h4","",title),make("p","proof-description",detail));
  const comparison=make("div","proof-comparison");
  appendCheck("FIRST CHECK",first,comparison);
  if(record.checks.length>1)appendCheck("LATEST CHECK",latest,comparison);
  holder.append(comparison);
  holder.append(make("p","proof-empty",record.checks.length+" public check(s) recorded in this browser."));
  const link=safeLink(latest.url||$("proof-url").value,"VIEW LIVE SOURCE ↗");if(link)holder.append(link);
 }
 function resetOutput(){const n=$("proof-result");n.replaceChildren();renderHistory();}
 function presetExpected(){
  if(!context)return;
  const field=$("proof-field").value;
  $("proof-expected").value=field==="heading"||field==="person_name"?context.subject:
   field==="official_website"&&context.anchor&&/^https:\/\//.test(context.anchor)&&!/(linkedin|imdb|wikidata|wikipedia|instagram)\.com\b/i.test(context.anchor)?context.anchor:
   field==="same_as"&&context.anchor&&context.anchor!==$("proof-url").value?context.anchor:"";
  renderHistory();
 }
 document.addEventListener("ulab:repair-open",event=>{
  const data=event.detail||{},platform=data.platform==="wikidata"?"wikidata":
   data.platform==="website"||data.type==="site"?"website":null;
  context=platform?{platform,subject:String(data.subject||""),anchor:String(data.anchor||"")}:null;
  $("proof-panel").hidden=false;
  $("proof-form").hidden=!platform;
  $("proof-unsupported").hidden=!!platform;
  $("proof-result").replaceChildren();
  $("proof-history").replaceChildren();
  if(!platform)return;
  $("proof-url").value=String(data.url||data.anchor||"");
  const select=$("proof-field");select.replaceChildren();
  for(const [value,label] of fields[platform]){
   const option=document.createElement("option");option.value=value;option.textContent=label;select.append(option);
  }
  presetExpected();
 });
 $("proof-field").addEventListener("change",presetExpected);
 $("proof-url").addEventListener("input",resetOutput);
 $("proof-expected").addEventListener("input",resetOutput);
 $("proof-form").addEventListener("submit",async event=>{
  event.preventDefault();if(!context)return;
  const body={platform:context.platform,url:$("proof-url").value.trim(),field:$("proof-field").value,expected:$("proof-expected").value.trim()};
  const key=caseKey(),button=$("proof-check"),output=$("proof-result");
  output.replaceChildren();button.disabled=true;button.textContent="Checking the public record...";
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
  try{
   const response=await fetch("/api/verify-repair",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),signal:controller.signal});
   const proof=await response.json();
   if(!response.ok)throw new Error(proof.error||"Public check failed.");
   if(proof.status==="unavailable"){
    output.append(make("p","proof-error","This public source could not be checked: "+(proof.error||"Unavailable")+". No result was recorded."));
    return;
   }
   if(!["verified_public","not_visible"].includes(proof.status))throw new Error("Source returned an unknown verification state.");
   const store=readStore(),record=store[key]&&Array.isArray(store[key]?.checks)?store[key]:{subject:context.subject,platform:body.platform,url:body.url,field:body.field,expected:body.expected,checks:[]};
   record.checks.push({url:proof.url,observed:proof.observed,status:proof.status,checkedAt:proof.checkedAt});
   record.checks=record.checks.slice(-12);
   store[key]=record;
   // Keep local results bounded, while protecting the active case.
   const keys=Object.keys(store);
   if(keys.length>60){for(const oldKey of keys.slice(0,keys.length-60))if(oldKey!==key)delete store[oldKey];}
   try{localStorage.setItem(STORE,JSON.stringify(store));}
   catch{throw new Error("Public check completed, but browser storage is unavailable. The before/after history could not be saved.");}
   output.append(make("p","proof-success",proof.status==="verified_public"?"Exact expected value found in the public record.":"Expected value not found in the inspected public field."));
   renderHistory();
  }catch(error){
   output.append(make("p","proof-error",error.name==="AbortError"?"Public check timed out. Nothing was recorded.":String(error.message||"Public check failed.")));
  }finally{clearTimeout(timer);button.disabled=false;button.textContent="Check the live public record ↗";}
 });
})();
