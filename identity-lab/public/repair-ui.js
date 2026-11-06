// Ulab execution pilot: honest owner-review workflow for known, approved website fixes.
// Visitors cannot invoke operator-only GitHub writes. No client token, password or secrets.
(()=>{
 "use strict";
 const $=id=>document.getElementById(id);
 const element=(tag,cls,value)=>{
  const e=document.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=String(value);return e;
 };
 let plans=[],currentIdentity=null,requestSequence=0;
 function render(){
  const holder=$("tab-content");
  if(!holder||!document.querySelector('[data-tab="fixes"]')?.classList.contains("active"))return;
  holder.querySelectorAll(".execution-pilot").forEach(x=>x.remove());
  if(!plans.length)return;
  const wrap=element("section","execution-pilot"),top=element("div","execution-top");
  top.append(element("span","execution-kicker","OWNER-AUTHORIZED REPAIR PILOT"));
  top.append(element("span","execution-state","PROPOSAL READY · NOT PUBLISHED"));
  wrap.append(top,element("h3","execution-title","From a finding to a real correction."));
  wrap.append(element("p","execution-description","This first-party website issue has a precise, reviewable change. Ulab has prepared a GitHub draft pull request. Nothing has been deployed to the public website."));
  for(const plan of plans){
   const card=element("article","execution-card");
   card.append(element("strong","",plan.title));
   card.append(element("p","execution-description",plan.description));
   const actions=element("div","execution-progress");
   actions.append(element("span","execution-done","01  ISSUE IDENTIFIED"));
   actions.append(element("span","execution-done","02  REVIEWABLE PATCH PREPARED"));
   actions.append(element("span","execution-pending","03  AWAITING OWNER REVIEW"));
   actions.append(element("span","execution-pending","04  LIVE VERIFICATION PENDING"));
   card.append(actions);
   const changeBox=element("div","execution-patch");
   for(const patch of (plan.changes||[]).slice(0,4)){
    const line=element("div","execution-patch-row");
    line.append(element("span","execution-before",patch.from),element("span","execution-arrow","→"),element("span","execution-after",patch.to));
    changeBox.append(line);
   }
   card.append(changeBox);
   const buttons=element("div","execution-buttons");
   if(plan.existingReviewUrl){
    try{
     const u=new URL(plan.existingReviewUrl);
     if(u.protocol==="https:"&&u.hostname==="github.com"){
      const link=element("a","small-button","Review draft PR ↗");
      link.href=u.href;link.target="_blank";link.rel="noopener noreferrer";
      buttons.append(link);
      const copy=element("button","small-button","Copy review URL");
      copy.type="button";copy.addEventListener("click",async()=>{
       try{await navigator.clipboard.writeText(u.href);copy.textContent="Copied";}catch{copy.textContent=u.href;}
      });
      buttons.append(copy);
     }
    }catch{}
   }
   const check=element("button","small-button","Capture / verify live result");
   check.type="button";check.addEventListener("click",()=>{
    document.dispatchEvent(new CustomEvent("ulab:repair-open",{detail:{
     subject:plan.subject,platform:"website",type:"site",url:plan.site,anchor:currentIdentity?.link||""
    }}));
    const dialog=$("fix-dialog");if(typeof dialog?.showModal==="function"&&!dialog.open)dialog.showModal();
   });
   buttons.append(check);card.append(buttons);
   card.append(element("p","execution-note","GitHub review is required before publication. An open pull request or approved edit does not mean a live correction has been verified."));
   wrap.append(card);
  }
  holder.prepend(wrap);
 }
 async function fetchPlans(detail){
  currentIdentity={name:detail.name||"",link:detail.link||""};plans=[];
  const seq=++requestSequence;
  render();
  const params=new URLSearchParams({name:currentIdentity.name,link:currentIdentity.link});
  try{
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
   let res;
   try{res=await fetch("/api/repair-plans?"+params,{method:"GET",signal:controller.signal,headers:{Accept:"application/json"}});}
   finally{clearTimeout(timer);}
   if(!res.ok)throw Error("Repair plans unavailable");
   const data=await res.json();
   if(seq!==requestSequence)return;
   plans=Array.isArray(data.plans)?data.plans.slice(0,3).filter(x=>x&&x.workflow==="owner_approved_github_draft_pr"):[];
  }catch{if(seq===requestSequence)plans=[];}
  render();
 }
 document.addEventListener("ulab:report-ready",event=>fetchPlans(event.detail||{}));
 document.addEventListener("ulab:fix-tab",render);
})();
