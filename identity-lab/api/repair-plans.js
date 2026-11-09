// Read-only list of narrowly supported website repair plans.
// This does not prove ownership, approve a repair, or trigger any GitHub write.
import {publicPlan} from "../lib/repair-execution-plans.mjs";

const pilot=Object.freeze({name:"Keenan Gray",hosts:["thiskeenan.com","www.thiskeenan.com"],planId:"about-identity-001"});
function matched(query){
 if(typeof query?.name!=="string"||query.name.trim().toLowerCase()!==pilot.name.toLowerCase())return false;
 try{
  const u=new URL(String(query?.link||""));
  return u.protocol==="https:"&&pilot.hosts.includes(u.hostname.toLowerCase())&&!u.username&&!u.password;
 }catch{return false;}
}
export default function handler(req,res){
 res.setHeader("Cache-Control","no-store");
 res.setHeader("X-Content-Type-Options","nosniff");
 if(req.method!=="GET"){res.setHeader("Allow","GET");return res.status(405).json({error:"Use GET."});}
 const eligible=matched(req.query||{});
 const plans=eligible?[{...publicPlan(pilot.planId),
  existingReviewUrl:"https://github.com/thiskeenan-glitch/keenan-gray-site/pull/11",
  workflow:"owner_approved_github_draft_pr",
  status:"proposal_prepared",
  note:"Existing draft proposal available for owner review. It has not been merged or verified on the public website."}]:[];
 return res.status(200).json({plans,executionAvailableToVisitors:false,
  message:eligible?"One curated owner-site repair has a reviewable GitHub proposal. Other findings require verification.":"No owner-approved execution plan is available for this identity. The research and manual correction drafts still work."});
}
