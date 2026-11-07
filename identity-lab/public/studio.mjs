// Ulab first-party repair beta: account owner publishes an exact approved identity record.
// No visitor can write through an unauthenticated endpoint. External profiles are not edited.
const $=id=>document.getElementById(id);
const show=(id,yes)=>{$(id).hidden=!yes;};
const el=(tag,cls="",value)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(value!==undefined)node.textContent=String(value);return node;};
const say=(message,error=false)=>{const n=$("notice");n.textContent=message;n.classList.toggle("error",error);};
const previewOnly="Identity cards are unverified self-published records. Search indexing is disabled in this beta.";
let api=null,user=null,records=[],editing=null,busy=false;
const timestamp=()=>new Date().toISOString();
async function loadClient(){
 if(!window.supabase?.createClient){
  const script=document.createElement("script");
  script.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.0/dist/umd/supabase.min.js";
  script.crossOrigin="anonymous";script.referrerPolicy="no-referrer";
  await new Promise((done,fail)=>{script.onload=done;script.onerror=()=>fail(Error("Account library failed to load."));document.head.append(script);});
 }
 if(!window.supabase?.createClient)throw Error("Account library did not initialize.");
 const response=await fetch("/api/identity-config",{cache:"no-store"});
 if(!response.ok)throw Error("Account config is unavailable.");
 const cfg=await response.json();
 if(cfg.enabled!==true||!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(cfg.url||"")||
  typeof cfg.publishableKey!=="string"||!cfg.publishableKey.startsWith("sb_publishable_"))
  return null;
 return window.supabase.createClient(cfg.url,cfg.publishableKey,{auth:{
  autoRefreshToken:true,persistSession:true,detectSessionInUrl:true,flowType:"implicit"
 }});
}
function fieldsFromForm(){
 const slug=$("slug").value.trim().toLowerCase(),display_name=$("display-name").value.trim(),
  headline=$("headline").value.trim(),website_url=$("website").value.trim()||null,
  urls=$("profiles").value.split(/\n|,/).map(x=>x.trim()).filter(Boolean);
 if(!/^[a-z0-9][a-z0-9-]{1,46}[a-z0-9]$/.test(slug)||["admin","api","support","help","account","google","ulab","root","system","null","test"].includes(slug))
  throw Error("Choose a unique slug using 3–48 lowercase letters, numbers or hyphens.");
 if(display_name.length<2||display_name.length>100||headline.length>180)
  throw Error("Check the professional name and description lengths.");
 const checkUrl=raw=>{
  if(!raw)return null;
  let u;try{u=new URL(raw);}catch{throw Error("Use a full HTTPS URL for each link.");}
  if(u.protocol!=="https:"||u.username||u.password||u.port||!u.hostname.includes(".")||
   /^(\d{1,3}\.){3}\d{1,3}$/.test(u.hostname)||u.hostname.endsWith(".local"))
   throw Error("Use public HTTPS profiles only.");
  u.hash="";return u.href;
 };
 if(urls.length>8)throw Error("Add no more than eight profile URLs.");
 const profile_urls=[...new Set(urls.map(checkUrl).filter(Boolean))];
 if(!website_url&&!profile_urls.length)throw Error("Add at least one website or professional profile URL.");
 return {slug,display_name,headline,website_url:checkUrl(website_url),profile_urls};
}
function setForm(row=null){
 editing=row;
 $("profile-form").reset();
 $("slug").readOnly=!!row;
 $("slug").value=row?.slug||"";
 $("display-name").value=row?.display_name||"";
 $("headline").value=row?.headline||"";
 $("website").value=row?.website_url||"";
 $("profiles").value=(row?.profile_urls||[]).join("\n");
 $("editor-state").textContent=row?(row.state==="published"?"PUBLISHED · EDIT WITH APPROVAL":"SAVED DRAFT"):"NEW DRAFT";
 $("save-draft").disabled=!!row&&row.state==="published";
 show("published-panel",!!row&&row.state==="published");
 if(row?.state==="published"){
  const url=location.origin+"/u/"+encodeURIComponent(row.slug);
  $("public-link").href=url;
  $("proof-status").textContent="Run a public HTTP check to verify the current published record. "+previewOnly;
  loadMonitor(row.id).catch(()=>{});
 }
}
function applyPilotHandoff(){
 let raw=null;
 try{
  raw=sessionStorage.getItem("ulab.studio.prefill.v1");
  if(!raw)return;
  sessionStorage.removeItem("ulab.studio.prefill.v1");
  const draft=JSON.parse(raw);
  if(draft?.source!=="ulab_identity_graph_review")return;
  setForm();
  $("slug").value=typeof draft.slug==="string"?draft.slug.slice(0,48):"";
  $("display-name").value=typeof draft.display_name==="string"?draft.display_name.slice(0,100):"";
  $("headline").value="";
  $("website").value=typeof draft.website_url==="string"?draft.website_url.slice(0,1000):"";
  $("profiles").value=(Array.isArray(draft.profile_urls)?draft.profile_urls:[])
   .filter(x=>typeof x==="string").slice(0,8).join("\n");
  $("attestation").checked=false;
  say("Imported Ulab's source candidates into an unpublished draft. Confirm each link belongs to the right person before approving publication.");
 }catch{say("Draft import could not be read. Your private identity record was not changed.",true);}
}
function rowCard(row){
 const card=el("article","record");
 card.append(el("strong","",row.display_name));
 card.append(el("p","",row.state.toUpperCase()+" · Version "+row.version+" · "+row.slug));
 const bar=el("div","buttons"),edit=el("button","secondary","Edit / review");
 edit.type="button";edit.onclick=()=>{setForm(row);$("profile-form").scrollIntoView({behavior:"smooth"});};
 bar.append(edit);
 if(row.state==="published"){
  const a=el("a","secondary","View public profile");a.href=location.origin+"/u/"+row.slug;a.target="_blank";a.rel="noopener noreferrer";bar.append(a);
 }
 card.append(bar);return card;
}
async function loadRecords(){
 if(!user)return;
 const {data,error}=await api.from("idlab_public_identities")
  .select("id,slug,display_name,headline,website_url,profile_urls,state,version,published_at,owner_attestation,updated_at")
  .order("updated_at",{ascending:false}).limit(30);
 if(error)throw Error("Could not load identity records: "+error.message);
 records=data||[];
 const list=$("existing");list.replaceChildren();
 if(!records.length)list.append(el("p","","No identity records yet. Create your first private draft below."));
 for(const row of records)list.append(rowCard(row));
 if(editing){
  const refreshed=records.find(x=>x.id===editing.id);
  if(refreshed)setForm(refreshed);
 }
}
async function refreshSession(){
 if(!api)return;
 const {data,error}=await api.auth.getUser();
 user=error?null:data?.user||null;
 show("signed-in",!!user);show("signed-out",!user);
 if(!user){editing=null;say("Sign in with an invited account to publish and verify your identity record.");return;}
 $("account-email").textContent=user.email||"Signed in";
 try{await loadRecords();say("Private account connected. Edits are owner-authorized, public profiles are self-published and unverified.");}
 catch(e){say(e.message,true);}
}
async function save(publish=false){
 if(busy)return;
 busy=true;$("publish").disabled=true;$("save-draft").disabled=true;
 try{
  if(!user)throw Error("Sign in first.");
  if(publish&&!$("attestation").checked)throw Error("You must approve the exact information and confirm you are authorized to publish it.");
  if(editing?.state==="published"&&!publish)throw Error("A published record cannot be silently reverted to a draft.");
  const fields=fieldsFromForm(),now=timestamp();
  const version=(editing?.version||0)+1;
  const payload={...fields,state:publish?"published":"draft",
   version,owner_attestation:publish,published_at:publish?now:null,updated_at:now};
  let q;
  if(editing){
   if(editing.slug!==fields.slug)throw Error("The slug cannot change after creation.");
   q=api.from("idlab_public_identities").update(payload).eq("id",editing.id)
    .eq("version",editing.version).select("*").single();
  }else q=api.from("idlab_public_identities").insert({...payload,owner_id:user.id}).select("*").single();
  const {data,error}=await q;
  if(error)throw Error("Could not save: "+error.message);
  if(!data)throw Error("This record changed elsewhere. Reload before updating.");
  editing=data;
  await loadRecords();
  say(publish?"Published an owner-attested Ulab record. Independently verify the live public page next.":"Private draft saved. Nothing is publicly visible.");
  if(publish)await verifyPublic();
 }catch(e){say(e.message||"Unable to save.",true);}
 finally{busy=false;$("publish").disabled=false;$("save-draft").disabled=!!editing&&editing.state==="published";}
}
async function verifyPublic(){
 const row=editing;
 if(!row||row.state!=="published")return;
 const box=$("proof-status");box.textContent="Reading the public profile over HTTPS…";
 try{
  const url="/u/"+encodeURIComponent(row.slug);
  const res=await fetch(url,{method:"GET",cache:"no-store",headers:{Accept:"text/html"}});
  if(!res.ok)throw Error("The public page returned HTTP "+res.status+".");
  const body=await res.text();
  if(body.length>100000)throw Error("Public page was unexpectedly large.");
  const doc=new DOMParser().parseFromString(body,"text/html");
  const payload=doc.getElementById("ulab-public-record");
  if(!payload||!payload.textContent)throw Error("Public identity data was not present in the response.");
  const observed=JSON.parse(payload.textContent);
  const actual=fieldsFromForm();
  const mismatches=[];
  for(const field of ["slug","display_name","headline","website_url"]){
   if((observed[field]||null)!==(actual[field]||null))mismatches.push(field);
  }
  if(JSON.stringify(observed.profile_urls||[])!==JSON.stringify(actual.profile_urls))mismatches.push("profile_urls");
  if(observed.version!==row.version)mismatches.push("version");
  if(!doc.querySelector('meta[name="robots"][content*="noindex"]'))mismatches.push("beta_noindex");
  box.textContent=mismatches.length?"PUBLIC VERIFICATION INCOMPLETE: "+mismatches.join(", "):
   "VERIFIED: Public Ulab page returned the approved fields and version "+row.version+". No third-party platforms were edited.";
 }catch(e){box.textContent="PUBLIC VERIFICATION UNAVAILABLE: "+String(e.message||"unexpected error");}
}
async function loadMonitor(identityId){
 $("monitor-status").textContent="Checking maintenance status…";
 const [monitorResult,runsResult]=await Promise.all([
  api.from("idlab_public_identity_monitors").select("expected_version,updated_at").eq("identity_id",identityId).maybeSingle(),
  api.from("idlab_public_identity_monitor_runs").select("status,checked_at,observed_version,expected_version")
   .eq("identity_id",identityId).order("checked_at",{ascending:false}).limit(3)
 ]);
 if(monitorResult.error||runsResult.error)throw Error("Monitoring records unavailable.");
 const monitor=monitorResult.data;
 if(!monitor){$("monitor-status").textContent="Monitoring not activated. Publish and verify, then enable the first baseline.";return;}
 const recent=runsResult.data?.[0];
 $("monitor-status").textContent="Baseline version "+monitor.expected_version+
  ". "+(recent?"Last background check "+new Date(recent.checked_at).toLocaleString()+" · "+recent.status.toUpperCase()+" (observed v"+recent.observed_version+").":
   "No scheduled check result yet. Baseline exists; this does not mean the live web was verified.");
}
async function enableMonitor(){
 if(!editing||editing.state!=="published")return;
 $("enable-monitor").disabled=true;
 try{
  const {data,error}=await api.rpc("idlab_start_identity_monitor",{p_id:editing.id});
  if(error||data!==true)throw Error(error?.message||"The monitoring baseline was not recorded.");
  await loadMonitor(editing.id);
  say("Owner-approved monitoring baseline saved. Scheduled checks inspect the stored record, not Google or external websites.");
 }catch(e){say(e.message,true);}finally{$("enable-monitor").disabled=false;}
}
$("login-form").addEventListener("submit",async e=>{
 e.preventDefault();if(!api)return;
 $("login-button").disabled=true;
 try{
  const email=$("email").value.trim();
  const {error}=await api.auth.signInWithOtp({email,options:{
   shouldCreateUser:false,emailRedirectTo:location.origin+"/studio"
  }});
  if(error)throw error;say("Check your email for a private sign-in link.");
 }catch(error){say("Sign-in request failed: "+error.message,true);}finally{$("login-button").disabled=false;}
});
$("profile-form").addEventListener("submit",e=>{e.preventDefault();save(true);});
$("save-draft").addEventListener("click",()=>save(false));
$("new-record").addEventListener("click",()=>setForm());
$("verify-live").addEventListener("click",verifyPublic);
$("enable-monitor").addEventListener("click",enableMonitor);
$("logout").addEventListener("click",async()=>{if(api){await api.auth.signOut();await refreshSession();}});
(async()=>{
 try{
  api=await loadClient();
  if(!api){show("unavailable",true);say("Private beta accounts are disabled. Public publishing and customer writes remain locked.");return;}
  api.auth.onAuthStateChange(()=>setTimeout(()=>refreshSession().catch(e=>say(e.message,true)),0));
  await refreshSession();
  applyPilotHandoff();
 }catch(e){show("unavailable",true);say("Account setup unavailable: "+String(e.message||"unknown error"),true);}
})();
