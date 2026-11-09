/* Ulab Cinematic home: visual interaction only. No fake API results or fabricated knowledge panels.
   The existing scan, report and correction handlers remain in app.js. */
(()=>{
 "use strict";
 const home=document.getElementById("home-screen");
 const universe=document.getElementById("identity-universe");
 const visualName=document.getElementById("visual-name");
 const visualRole=document.getElementById("visual-role");
 const name=document.getElementById("person-name");
 const site=document.getElementById("site-url");
 if(!home||!universe||!visualName||!visualRole||!name)return;
 const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
 const mobile=window.matchMedia("(max-width: 920px)");
 const sampleName="Someone like you.";
 const roles={
  base:"A whole story, in pieces.",
  press:"The stories told about you.",
  work:"What you've made and done.",
  profile:"Where your name appears.",
  knowledge:"Public records and recognition."
 };
 function syncName(){
  const value=name.value.replace(/\s+/g," ").trim().slice(0,35);
  visualName.textContent=value||sampleName;
  const center=document.getElementById("identity-center");
  center?.classList.toggle("has-name",!!value);
 }
 name.addEventListener("input",syncName,{passive:true});
 syncName();
 const nodes=[
  [".node-press","press"],[".node-work","work"],
  [".node-profile","profile"],[".node-knowledge","knowledge"]
 ];
 let activeRole=null,roleTimer=null;
 function applyRole(next){
  activeRole=next;
  visualRole.textContent=roles[next]||roles.base;
  universe.classList.toggle("is-exploring",!!next);
 }
 for(const [selector,role] of nodes){
  const node=universe.querySelector(selector);
  if(!node)continue;
  node.addEventListener("pointerenter",()=>{
   if(roleTimer)clearTimeout(roleTimer);
   applyRole(role);
  });
  node.addEventListener("pointerleave",()=>{
   if(roleTimer)clearTimeout(roleTimer);
   roleTimer=setTimeout(()=>applyRole(null),350);
  });
 }
 universe.addEventListener("pointermove",event=>{
  if(reduced.matches||mobile.matches)return;
  const bounds=universe.getBoundingClientRect();
  const x=(event.clientX-bounds.left-bounds.width/2)/bounds.width;
  const y=(event.clientY-bounds.top-bounds.height/2)/bounds.height;
  universe.style.setProperty("--mx",(x*18).toFixed(2)+"px");
  universe.style.setProperty("--my",(y*18).toFixed(2)+"px");
 },{passive:true});
 universe.addEventListener("pointerleave",()=>{
  universe.style.setProperty("--mx","0px");
  universe.style.setProperty("--my","0px");
 });
 const revealItems=[...document.querySelectorAll("[data-reveal]")];
 if("IntersectionObserver" in window&&!reduced.matches){
  const observer=new IntersectionObserver(entries=>{
   for(const entry of entries){
    if(!entry.isIntersecting)continue;
    entry.target.classList.add("is-visible");
    observer.unobserve(entry.target);
   }
  },{threshold:.14,rootMargin:"0px 0px 15px 0px"});
  revealItems.forEach((item,i)=>{
   item.style.transitionDelay=Math.min(i*110,250)+"ms";
   observer.observe(item);
  });
 }else revealItems.forEach(item=>item.classList.add("is-visible"));
 const focusEntry=()=>{
  if(home.hidden){
   document.getElementById("home-logo")?.click();
  }
  home.scrollIntoView({behavior:reduced.matches?"instant":"smooth",block:"start"});
  window.setTimeout(()=>name.focus({preventScroll:true}),reduced.matches?0:380);
 };
 document.getElementById("bottom-start")?.addEventListener("click",focusEntry);
 for(const anchor of document.querySelectorAll("[data-home-nav]")){
  anchor.addEventListener("click",event=>{
   const href=anchor.getAttribute("href");
   if(!href?.startsWith("#"))return;
   if(home.hidden){
    event.preventDefault();
    document.getElementById("home-logo")?.click();
    window.setTimeout(()=>{
     const target=document.querySelector(href);
     target?.scrollIntoView({behavior:reduced.matches?"instant":"smooth"});
     if(href==="#identity-form")name.focus({preventScroll:true});
    },0);
   }else if(href==="#identity-form"){
    event.preventDefault();
    focusEntry();
   }
  });
 }
 // Synchronize the visual source-state with the user's input without claiming
 // any discovery, validation, or knowledge panel visibility.
 site?.addEventListener("input",()=>{
  const center=document.getElementById("identity-center");
  center?.classList.toggle("has-anchor",site.value.trim().length>0);
 },{passive:true});
})();
