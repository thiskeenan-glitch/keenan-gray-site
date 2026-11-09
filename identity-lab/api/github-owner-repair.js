// Authenticated Ulab repair workflow. A visitor cannot issue a GitHub edit by naming a URL.
// The only supported operation is a reviewed, fixed-scope website draft PR.
import {oauthConfig,readSession,requireSameOrigin} from "../lib/github-session.mjs";
import {executeApprovedRepair} from "../lib/github-repair-executor.mjs";
import {getPlan,publicPlan} from "../lib/repair-execution-plans.mjs";
const PLAN_ID="filmshow-role-002";
function respond(res,status,obj){
 res.setHeader("Cache-Control","no-store");
 res.setHeader("X-Content-Type-Options","nosniff");
 return res.status(status).json(obj);
}
function safeHtmlSnippet(raw){
 return raw.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,"")
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,"")
  .replace(/<[^>]+>/g," ").replace(/&nbsp;/g," ").replace(/\s+/g," ");
}
async function verifyPublicRole(){
 const plan=getPlan(PLAN_ID);
 const target=new URL(plan.targetUrl);
 if(target.protocol!=="https:"||target.origin!=="https://www.thiskeenan.com")
  throw Error("Unexpected verification host.");
 const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),7000);
 try{
  const u=new URL(target.href);u.searchParams.set("ulab_check",Date.now().toString());
  const response=await fetch(u,{signal:ctl.signal,redirect:"error",
   headers:{Accept:"text/html","Cache-Control":"no-cache"}});
  if(!response.ok)throw Error("Public page returned HTTP "+response.status);
  if(Number(response.headers.get("content-length")||0)>350000)throw Error("Unexpected page size.");
  const html=await response.text();
  if(html.length>350000)throw Error("Unexpected page size.");
  const text=safeHtmlSnippet(html);
  const current=text.includes("Role Co-Founder / Creative Director");
  const old=text.includes("Role Founder / Director");
  return {status:current?"verified_public":old?"old_value_visible":"not_observed",
   checkedAt:new Date().toISOString(),url:plan.targetUrl,
   expected:plan.verification.expected,
   evidence:current?"The public page displays the approved role.":old?
    "The public page still displays the previous role.":"The expected role was not found in the public page.",
   note:"Public content check only. It does not prove search indexing or Knowledge Panel creation."};
 }finally{clearTimeout(timer);}
}
export default async function handler(req,res){
 const config=oauthConfig();
 if(!config)return respond(res,503,{error:"GitHub repair is not configured for this Ulab deployment."});
 const session=readSession(req,config);
 if(!session)return respond(res,401,{error:"Connect the authorized GitHub owner account first."});
 if(req.method==="GET"){
  const action=String(req.query?.action||"plan");
  if(action==="plan")return respond(res,200,{plan:publicPlan(PLAN_ID),
   account:session.login,mode:"draft_pull_request_only",published:false});
  if(action==="verify"){
   try{return respond(res,200,await verifyPublicRole());}
   catch(e){return respond(res,200,{status:"unavailable",error:"The public page could not be verified.",detail:String(e.message).slice(0,90)});}
  }
  return respond(res,400,{error:"Unknown read action."});
 }
 if(req.method!=="POST"){res.setHeader("Allow","GET, POST");return respond(res,405,{error:"Method not allowed."});}
 if(!requireSameOrigin(req,config))return respond(res,403,{error:"Same-origin approval required."});
 let data;try{
  data=typeof req.body==="string"?JSON.parse(req.body):req.body;
  if(!data||JSON.stringify(data).length>300||data.planId!==PLAN_ID||data.approval!=="OWNER_APPROVED_DRAFT_PR")
   throw Error("Explicit approval of this exact repair plan is required.");
 }catch(e){return respond(res,400,{error:String(e.message).slice(0,120)});}
 try{
  const result=await executeApprovedRepair(PLAN_ID,{token:session.token});
  return respond(res,200,result);
 }catch(e){return respond(res,502,{error:"Unable to create a reviewable correction.",detail:String(e.message).slice(0,140)});}
}
