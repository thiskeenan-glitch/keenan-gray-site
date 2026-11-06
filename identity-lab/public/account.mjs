import {validPublicConfig,cleanCaseFields,cleanNote,statusLabel} from "/account-model.mjs";
const $=id=>document.getElementById(id);
const notice=(message,bad=false)=>{const el=$("notice");el.textContent=message;el.classList.toggle("error",Boolean(bad));};
const show=(id,visible)=>{$(id).hidden=!visible;};
const el=(tag,text,className)=>{const node=document.createElement(tag);if(text!==undefined&&text!==null)node.textContent=String(text);if(className)node.className=className;return node;};
let api=null,user=null,activeCaseId=null,busy=false;
function busyButton(id,doing){$(id).disabled=doing;}
function requireSession(){if(!user)throw new Error("Sign in to continue.");}
async function loadSdk(){
  if(window.supabase?.createClient)return window.supabase;
  const src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.0/dist/umd/supabase.min.js";
  const tag=document.createElement("script");
  tag.src=src;tag.crossOrigin="anonymous";tag.referrerPolicy="no-referrer";
  await new Promise((resolve,reject)=>{tag.onload=resolve;tag.onerror=()=>reject(new Error("Unable to load the sign-in library."));document.head.append(tag);});
  if(!window.supabase?.createClient)throw new Error("The sign-in library did not load correctly.");
  return window.supabase;
}
async function requestCases(){
  requireSession();
  const {data,error}=await api.from("idlab_cases").select("id,subject,summary,website_url,status,created_at,updated_at").order("created_at",{ascending:false}).limit(60);
  if(error)throw error;
  const list=$("cases-list");list.replaceChildren();
  if(!data?.length){list.append(el("p","No cases yet. Your first case will appear here.","empty"));return;}
  for(const row of data){
    const card=el("article",null,"case");
    const meta=el("div",statusLabel(row.status)+" / "+new Date(row.created_at).toLocaleDateString(),"meta");
    const title=el("h4",row.subject);
    const description=el("p",row.summary||"Professional identity case opened.");
    const btn=el("button","OPEN HISTORY","secondary");
    btn.type="button";btn.addEventListener("click",()=>openCase(row));
    card.append(meta,title,description);
    if(row.website_url){
      const a=el("a","VISIT PUBLIC WEBSITE ↗","public-site");
      a.href=row.website_url;a.target="_blank";a.rel="noopener noreferrer";card.append(a);
    }
    card.append(btn);list.append(card);
  }
}
async function openCase(record){
  requireSession();
  activeCaseId=record.id;
  show("activity-panel",true);
  $("activity-title").textContent=record.subject;
  const {data,error}=await api.from("idlab_case_events").select("id,kind,note,created_at,receipt,public_url").eq("case_id",record.id).order("created_at",{ascending:false}).limit(100);
  if(error){notice(error.message,true);return;}
  const list=$("case-events");list.replaceChildren();
  if(!data?.length){list.append(el("p","No history entries yet.","empty"));}
  for(const event of data||[]){
    const item=el("div",null,"event");
    item.append(el("strong",{
       customer_note:"Customer note",
       operator_note:"Operator note",
       submission_recorded:"Submission receipt recorded",
       public_observation:"Public observation recorded",
       public_reversion:"Public reversion reported"
     }[event.kind]||"Case activity"));
    item.append(el("small",new Date(event.created_at).toLocaleString()));
    item.append(el("p",event.note));
    if(event.receipt)item.append(el("small","Recorded platform receipt: "+event.receipt+" (not approval)"));
    if(event.public_url){const link=el("a","View public source ↗","public-site");link.href=event.public_url;link.target="_blank";link.rel="noopener noreferrer";item.append(link);}
    list.append(item);
  }
}
async function signedState(){
  if(!api)return;
  const {data,error}=await api.auth.getUser();
  user=error?null:data?.user||null;
  show("signed-in",Boolean(user));show("signed-out",!user);
  if(user){$("account-email").textContent=user.email||"Signed in";try{await requestCases();notice("Private case storage connected. You are signed in.");}catch(e){notice("Unable to load cases: "+e.message,true);}}
  else{activeCaseId=null;show("activity-panel",false);notice("Sign in with your email to access your private cases.");}
}
$("login-form").addEventListener("submit",async event=>{
 event.preventDefault();if(!api||busy)return;
 busy=true;busyButton("login-button",true);
 try{
  const email=$("email").value.trim();
  if(!email||email.length>254)throw new Error("Enter a valid email address.");
  const {error}=await api.auth.signInWithOtp({email,options:{shouldCreateUser:false,emailRedirectTo:location.origin+"/account"}});
  if(error)throw error;
  notice("Check your email for a one-time link. Access is currently invite-only.");
 }catch(e){notice(e.message,true);}finally{busy=false;busyButton("login-button",false);}
});
$("case-form").addEventListener("submit",async event=>{
 event.preventDefault();if(busy)return;
 busy=true;busyButton("create-case",true);
 try{
  requireSession();
  const payload=cleanCaseFields({subject:$("subject").value,website_url:$("website").value,summary:$("summary").value});
  const {error}=await api.from("idlab_cases").insert(payload);
  if(error)throw error;
  $("case-form").reset();await requestCases();notice("Case saved to your private account.");
 }catch(e){notice(e.message,true);}finally{busy=false;busyButton("create-case",false);}
});
$("note-form").addEventListener("submit",async event=>{
 event.preventDefault();if(busy)return;
 busy=true;busyButton("add-note",true);
 try{
  requireSession();if(!activeCaseId)throw new Error("Choose a case first.");
  const note=cleanNote($("note-body").value);
  const {error}=await api.from("idlab_case_events").insert({case_id:activeCaseId,kind:"customer_note",note});
  if(error)throw error;
  $("note-body").value="";
  const {data}=await api.from("idlab_cases").select("id,subject").eq("id",activeCaseId).single();
  if(data)await openCase(data);
  notice("Note saved. This does not submit a correction to an external site.");
 }catch(e){notice(e.message,true);}finally{busy=false;busyButton("add-note",false);}
});
$("reload").addEventListener("click",()=>requestCases().catch(e=>notice(e.message,true)));
$("close-activity").addEventListener("click",()=>{activeCaseId=null;show("activity-panel",false);});
$("logout").addEventListener("click",async()=>{
  if(!api)return;
  const {error}=await api.auth.signOut();
  if(error){notice(error.message,true);return;}
  await signedState();
});
async function boot(){
 try{
  const response=await fetch("/api/identity-config",{cache:"no-store",headers:{Accept:"application/json"}});
  if(!response.ok)throw new Error("The account configuration endpoint is unavailable.");
  const config=await response.json();
  if(!validPublicConfig(config)){show("unavailable",true);notice("Accounts are not enabled. Dedicated Identity Lab database connection required.");return;}
  const sdk=await loadSdk();
  api=sdk.createClient(config.url,config.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:"implicit"}});
  api.auth.onAuthStateChange(()=>{window.setTimeout(()=>signedState().catch(e=>notice(e.message,true)),0);});
  await signedState();
 }catch(e){show("unavailable",true);notice("Account setup is unavailable: "+e.message,true);}
}
boot();
