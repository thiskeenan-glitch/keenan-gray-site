(()=>{"use strict";
const $=id=>document.getElementById(id);
let connected=false,processing=false;
function say(id,message){$(id).textContent=message;}
async function request(path,options={}){
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),14000);
 try{
  const response=await fetch(path,{credentials:"same-origin",cache:"no-store",
   headers:{Accept:"application/json",...(options.body?{"Content-Type":"application/json"}:{})},
   ...options,signal:controller.signal});
  const body=await response.json();
  if(!response.ok)throw Error(body.error||body.detail||"Request failed ("+response.status+")");
  return body;
 }finally{clearTimeout(timeout);}
}
function updateControls(){
 $("connect").hidden=connected;
 $("disconnect").hidden=!connected;
 $("execute").disabled=!connected||processing||!$("approval").checked;
 $("verify").disabled=!connected||processing;
}
async function loadAccount(){
 try{
  const info=await request("/api/github-auth?action=status");
  connected=!!info.connected;
  say("account-status",connected?
   "Connected as "+info.account+". Authorized first-party repair is available.":
   "Not connected. Sign in using GitHub to approve a website repair.");
  if(new URLSearchParams(location.search).has("connected"))history.replaceState(null,"",location.pathname);
 }catch(error){
  connected=false;
  say("account-status",error.message+". GitHub OAuth must be configured in Ulab's server environment to activate this pilot.");
 }
 updateControls();
}
$("approval").addEventListener("change",updateControls);
$("disconnect").addEventListener("click",async()=>{
 try{
  await request("/api/github-auth?action=logout",{method:"POST",body:JSON.stringify({logout:true})});
  connected=false;$("approval").checked=false;
  say("account-status","Disconnected. The browser session is cleared.");
  updateControls();
 }catch(error){say("account-status","Unable to disconnect: "+error.message);}
});
$("execute").addEventListener("click",async()=>{
 if(!connected||!$("approval").checked||processing)return;
 processing=true;updateControls();
 say("execution-status","Ulab is checking the approved source file and GitHub branch…");
 $("review-link").replaceChildren();
 try{
  const data=await request("/api/github-owner-repair",{method:"POST",
   body:JSON.stringify({planId:"filmshow-role-002",approval:"OWNER_APPROVED_DRAFT_PR"})});
  say("execution-status",data.status==="already_present_in_source"?
   "The proposed correction is already in the source branch. Verify the public page before claiming success.":
   "Ulab "+(data.status==="draft_pr_created"?"created":"found")+" a draft pull request. Nothing has been published yet. Review the exact change before merging.");
  if(data.reviewUrl){
   const link=document.createElement("a"),url=new URL(data.reviewUrl);
   if(url.protocol==="https:"&&url.hostname==="github.com"&&
    url.pathname.startsWith("/thiskeenan-glitch/keenan-gray-site/pull/")){
    link.href=url.href;link.target="_blank";link.rel="noopener noreferrer";
    link.className="btn secondary";link.textContent="Review pull request ↗";
    $("review-link").append(link);
   }
  }
 }catch(error){say("execution-status","Repair not executed: "+error.message);}
 finally{processing=false;updateControls();}
});
$("verify").addEventListener("click",async()=>{
 if(!connected||processing)return;
 processing=true;updateControls();
 say("verification-status","Ulab is reading the public Filmshow page…");
 try{
  const check=await request("/api/github-owner-repair?action=verify");
  say("verification-status",check.status==="verified_public"?
   "VERIFIED LIVE: "+check.evidence+" Verified at "+check.checkedAt:
   check.status==="old_value_visible"?
    "NOT YET LIVE: "+check.evidence+" If you just merged a PR, allow the production deployment to complete.":
   "Unable to confirm the correction: "+(check.evidence||check.error||"Public page unavailable."));
 }catch(error){say("verification-status","Verification failed: "+error.message);}
 finally{processing=false;updateControls();}
});
loadAccount();
})();