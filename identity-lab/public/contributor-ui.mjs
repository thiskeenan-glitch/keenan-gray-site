import {makeCase,buildPacket,updateTask} from "/contributor-engine.mjs";
const key="identitylab.contributor-pilot.v1";
const $=s=>document.querySelector(s);
const form=$("#form"), list=$("#tasks"), output=$("#message"), download=$("#download");
let current=null, timer=0;
function el(tag,text,cls){const x=document.createElement(tag);if(text!==undefined&&text!==null)x.textContent=String(text);if(cls)x.className=cls;return x;}
function notify(message,error=false){output.textContent=message;output.style.color=error?"#a84332":"#4a7853";clearTimeout(timer);timer=setTimeout(()=>output.textContent="",9000);}
function count(){const wordCount=$("#bio").value.trim().split(/\s+/).filter(Boolean).length;$("#wordCount").textContent=wordCount+" words · IMDb requires 50+ words. Facts must be supported by evidence.";}
$("#bio").addEventListener("input",count);count();
function save(){if(!current)return;try{localStorage.setItem(key,JSON.stringify(current));}catch{notify("Local storage is unavailable. Download your case to retain it.",true);}}
function assignStatus(index,next,payload={}){
  try{current.tasks[index]=updateTask(current.tasks[index],next,payload);save();render();notify("Workflow record updated locally. No external platform has been changed.");}
  catch(error){notify(error.message,true);}
}
function render(){
  list.replaceChildren();download.disabled=!current;
  if(!current){list.append(el("p","Generate a case to see correction tasks.","placeholder"));return;}
  const facts=el("div",null,"small muted");facts.textContent=current.subject+" · "+current.tasks.length+" draft workflows · "+current.evidence.length+" evidence links";list.append(facts);
  current.tasks.forEach((task,i)=>{
    const card=el("article",null,"task"),head=el("div",null,"taskhead");
    const titlebox=el("div");titlebox.append(el("div",task.platform.toUpperCase()+" / "+task.operation,"pill"),el("h3",task.title));
    const status=el("span",task.status.replaceAll("_"," ").toUpperCase(),"badge");head.append(titlebox,status);card.append(head);
    card.append(el("p",task.notes,"small muted"));
    const details=el("details");details.append(el("summary","View evidence, requirements and permitted method"));
    const d=el("div");d.append(el("p","Profile: "+task.profile.url,"small"));
    const anchor=el("a","Open official profile ↗","small");anchor.href=task.profile.url;anchor.target="_blank";anchor.rel="noopener";d.append(anchor);
    d.append(el("p","Submission channel: "+task.writeChannel+"; no automation of third-party login or edits.","small"));
    for(const e of task.evidence){const link=el("a",e.label+" ↗","small");link.href=e.url;link.target="_blank";link.rel="noopener";link.style.display="block";d.append(link);}
    if(task.requirements.length){d.append(el("p","Outstanding requirements: "+task.requirements.join(" / "),"small"));}
    details.append(d);card.append(details);
    const controls=el("div",null,"btnrow");
    const packet=el("button","COPY PACKET","btn secondary");packet.type="button";packet.onclick=async()=>{
      try{await navigator.clipboard.writeText(buildPacket(task));notify("Correction packet copied.");}
      catch{notify("Clipboard unavailable. Download the case to retain details.",true);}
    };controls.append(packet);
    if(["draft","needs_source_review","needs_owner","rejected"].includes(task.status)){
      const prepare=el("button","REVIEW EVIDENCE","btn secondary");prepare.type="button";
      prepare.onclick=()=>assignStatus(i,"ready_for_review");controls.append(prepare);
    }
    if(task.status==="ready_for_review"){
      const submit=el("button","RECORD REAL SUBMISSION","btn");submit.type="button";
      submit.onclick=()=>{
        const receipt=prompt("Enter the real IMDb/TMDb submission reference or contribution ID. Do not invent one.");
        if(!receipt)return;
        if(!confirm("Confirm you personally submitted the correction through the platform and are recording a genuine receipt?"))return;
        task.approvedForSubmission=true;assignStatus(i,"submitted",{receipt});
      };controls.append(submit);
    }
    if(task.status==="submitted"){
      const accepted=el("button","VERIFY ACCEPTED EDIT","btn secondary");accepted.type="button";
      accepted.onclick=()=>{const url=prompt("Paste the publicly verified updated record URL.");if(url)assignStatus(i,"accepted",{publicVerification:url});};
      const rejected=el("button","MARK REJECTED","btn secondary");rejected.type="button";rejected.onclick=()=>assignStatus(i,"rejected");
      controls.append(accepted,rejected);
    }
    if(task.status==="accepted"){
      card.append(el("p","Verified public record: "+task.publicVerification,"success"));
    }
    if(task.blocked)card.append(el("div","Owner-locked IMDbPro biography: owner must update it through their account.","alert"));
    card.append(controls);list.append(card);
  });
}
form.addEventListener("submit",event=>{
  event.preventDefault();
  try{
    const sources=$("#evidence").value.split("\n").map(s=>s.trim()).filter(Boolean);
    const c=makeCase({
      name:$("#name").value,imdbUrl:$("#imdb").value,tmdbUrl:$("#tmdb").value,
      biography:$("#bio").value,evidence:sources,imdbClaimedLocked:$("#claimed").checked
    });
    current=c;save();render();notify("Created "+c.tasks.length+" correction workflows. None have been submitted.");
  }catch(error){notify(error.message,true);}
});
$("#reset").onclick=()=>{
  if(!confirm("Delete the saved contributor case on this browser?"))return;
  current=null;localStorage.removeItem(key);render();notify("This browser's saved case was cleared.");
};
download.onclick=()=>{
  if(!current)return;
  const blob=new Blob([JSON.stringify(current,null,2)],{type:"application/json"});
  const u=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=u;a.download="identity-lab-"+current.subject.toLowerCase().replace(/[^a-z0-9]+/g,"-")+"-corrections.json";
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1500);
};
try{const saved=localStorage.getItem(key);if(saved){const parsed=JSON.parse(saved);if(parsed&&Array.isArray(parsed.tasks)&&parsed.tasks.length<=10){current=parsed;notify("Restored the last saved case from this browser.");}}}catch{}
render();
