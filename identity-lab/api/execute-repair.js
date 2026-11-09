// Operator-only first-party repair execution. Disabled until explicit secrets and activation.
// Never expose operator credentials to client JavaScript or bypass owner review.
import {timingSafeEqual} from "node:crypto";
import {executeApprovedRepair} from "../lib/github-repair-executor.mjs";
import {getPlan} from "../lib/repair-execution-plans.mjs";

function authorized(req){
 const expected=process.env.IDLAB_REPAIR_OPERATOR_KEY;
 const value=String(req.headers?.authorization||"");
 if(!expected||expected.length<32||!value.startsWith("Bearer "))return false;
 const provided=value.slice(7);
 if(provided.length<32||provided.length>500)return false;
 const a=Buffer.from(expected,"utf8"),b=Buffer.from(provided,"utf8");
 return a.length===b.length&&timingSafeEqual(a,b);
}
function sameOrigin(req){
 const origin=req.headers?.origin;
 if(!origin)return true; // Non-browser operator clients may omit Origin.
 try{
  const u=new URL(origin);
  return u.protocol==="https:"&&u.host===String(req.headers?.host||"").toLowerCase();
 }catch{return false;}
}
export default async function handler(req,res){
 res.setHeader("Cache-Control","no-store");
 res.setHeader("X-Content-Type-Options","nosniff");
 if(req.method!=="POST"){res.setHeader("Allow","POST");return res.status(405).json({error:"Use POST."});}
 if(process.env.IDLAB_REPAIR_EXECUTION_ENABLED!=="true")return res.status(503).json({error:"Repair execution is not enabled on this deployment."});
 if(!sameOrigin(req))return res.status(403).json({error:"Cross-origin repair requests are prohibited."});
 if(!authorized(req))return res.status(401).json({error:"A verified Ulab operator is required."});
 const token=process.env.IDLAB_GITHUB_REPAIR_TOKEN;
 if(!token)return res.status(503).json({error:"No owner-authorized GitHub integration is configured."});
 let plan;
 try{
  const input=typeof req.body==="string"?JSON.parse(req.body):req.body||{};
  if(JSON.stringify(input).length>500)throw new Error("Request too large.");
  if(input.approval!=="OWNER_APPROVED_DRAFT_PR")throw new Error("Explicit owner approval is required.");
  plan=getPlan(input.planId);
 }catch(error){return res.status(400).json({error:String(error?.message||"Invalid repair request.")});}
 try{
  const result=await executeApprovedRepair(plan.id,{token});
  return res.status(200).json(result);
 }catch(error){
  // Errors are deliberately sanitized; never expose GitHub response bodies or tokens.
  return res.status(502).json({error:String(error?.message||"GitHub repair workflow failed.").slice(0,200)});
 }
}
