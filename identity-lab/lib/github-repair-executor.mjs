// Ulab GitHub website executor (draft PR only). Server side, permission-gated.
// Never merge, publish, create articles, or edit third-party records.
import {applyPlan,getPlan} from "./repair-execution-plans.mjs";

function ownerAndRepo(plan){
 const parts=plan.repository.split("/");
 if(parts.length!==2||!parts.every(x=>/^[\w.-]+$/.test(x)))throw new Error("Invalid allowlisted repository.");
 return {owner:parts[0],repo:parts[1]};
}
function githubClient(plan,{token,fetchImpl=fetch}={}){
 if(!token||typeof token!=="string")throw new Error("An authorized GitHub installation is required.");
 const {owner,repo}=ownerAndRepo(plan);
 const prefix="https://api.github.com/repos/"+owner+"/"+repo;
 return async function request(method,path,body){
  if(!path.startsWith("/")||path.startsWith("//")||path.includes(".."))throw new Error("Invalid GitHub request path.");
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
  try{
   const res=await fetchImpl(prefix+path,{
    method,redirect:"error",signal:controller.signal,
    headers:{"Authorization":"Bearer "+token,"Accept":"application/vnd.github+json",
     "X-GitHub-Api-Version":"2022-11-28","User-Agent":"UlabRepairPilot/0.1",
     ...(body===undefined?{}:{"Content-Type":"application/json"})},
    ...(body===undefined?{}:{body:JSON.stringify(body)})
   });
   const text=await res.text();
   if(text.length>500000)throw new Error("GitHub response exceeded allowed size.");
   let data={};
   try{data=text?JSON.parse(text):{};}catch{throw new Error("GitHub returned an unreadable response.");}
   if(!res.ok){
    const error=new Error("GitHub request failed with HTTP "+res.status+".");
    error.status=res.status;throw error;
   }
   return data;
  }finally{clearTimeout(timer);}
 };
}
function decodeFile(file){
 if(!file||file.type!=="file"||file.encoding!=="base64"||typeof file.content!=="string"||!file.sha)
  throw new Error("Expected a normal UTF-8 GitHub file.");
 return {sha:file.sha,content:Buffer.from(file.content.replace(/\s/g,""),"base64").toString("utf8")};
}
const enc=s=>encodeURIComponent(s);
function prResult(plan,pr,kind){
 if(!pr||typeof pr.html_url!=="string"||!/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/pull\/\d+$/.test(pr.html_url))throw new Error("Unrecognized GitHub pull request.");
 const expected="https://github.com/"+plan.repository+"/pull/";
 if(!pr.html_url.startsWith(expected))throw new Error("Unrelated pull request returned.");
 return {status:kind,planId:plan.id,reviewUrl:pr.html_url,pullNumber:pr.number||null,
  published:false,mergePerformed:false,sourceChangedByRequest:kind==="draft_pr_created",
  note:"Draft pull request only. The site owner must review and merge it; then Ulab can verify the live public record."};
}
function matchingPr(pr,plan){
 const owner=ownerAndRepo(plan).owner;
 return pr?.head?.ref===plan.repairBranch&&
  pr?.head?.repo?.full_name===plan.repository&&pr?.base?.ref===plan.baseBranch&&
  pr?.state==="open";
}
export async function executeApprovedRepair(id,{token,fetchImpl=fetch}={}){
 const plan=getPlan(id),request=githubClient(plan,{token,fetchImpl});
 const {owner}=ownerAndRepo(plan);
 const pullPath="/pulls?state=open&head="+enc(owner+":"+plan.repairBranch)+"&base="+enc(plan.baseBranch)+"&per_page=10";
 const existing=await request("GET",pullPath);
 if(!Array.isArray(existing))throw new Error("GitHub did not return a pull request list.");
 const prior=existing.find(pr=>matchingPr(pr,plan));
 if(prior)return prResult(plan,prior,"draft_pr_already_open");

 const branchPath="/git/ref/heads/"+plan.repairBranch.split("/").map(enc).join("/");
 let branch=null;
 try{branch=await request("GET",branchPath);}
 catch(err){if(err.status!==404)throw err;}

 let baseSha=null;
 if(!branch){
  const ref=await request("GET","/git/ref/heads/"+enc(plan.baseBranch));
  baseSha=ref?.object?.sha;
  if(!/^[a-f0-9]{40}$/.test(baseSha||""))throw new Error("Could not resolve reviewed base branch.");
 }
 const filePath="/contents/"+plan.path.split("/").map(enc).join("/");
 const file=decodeFile(await request("GET",filePath+"?ref="+enc(branch?plan.repairBranch:plan.baseBranch)));
 const applied=applyPlan(plan.id,file.content);

 if(!branch){
  if(!applied.changed)return {status:"already_present_in_source",planId:plan.id,published:false,mergePerformed:false,
   note:"The expected content is already on the base branch. Independently check the live site; do not count an unobserved correction."};
  await request("POST","/git/refs",{ref:"refs/heads/"+plan.repairBranch,sha:baseSha});
 }else if(applied.changed){
  // Existing branch may belong to an unrelated change. Do not overwrite it.
  throw new Error("Repair branch exists but does not contain the approved change. Manual review is required.");
 }
 if(applied.changed){
  await request("PUT",filePath,{
   message:"Ulab repair "+plan.id+": propose owner-approved identity correction",
   content:Buffer.from(applied.content,"utf8").toString("base64"),
   sha:file.sha,branch:plan.repairBranch
  });
 }
 const pr=await request("POST","/pulls",{
  title:"Ulab repair: "+plan.title,head:plan.repairBranch,base:plan.baseBranch,draft:true,
  body:"Identity repair: "+plan.id+"\n\n"+plan.description+
   "\n\nPublic source: "+plan.targetUrl+
   "\n\nVerification target: "+plan.verification.field+" = "+plan.verification.expected+
   "\n\nOwner review required. This workflow does not merge or deploy the change. Capture a public baseline and recheck after publication."
 });
 return prResult(plan,pr,"draft_pr_created");
}
