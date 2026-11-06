// Read-only verification endpoint. Does not access accounts or submit edits.
import {inspectPublicHomepage} from "../lib/safe-site-inspection.mjs";
import {parseProofRequest,verifyWebsite,verifyWikidata} from "../lib/repair-proof.mjs";

const buckets=new Map();
function permitted(req){
 const ip=String(req.headers?.["x-forwarded-for"]||req.socket?.remoteAddress||"unknown").split(",")[0].slice(0,80);
 const now=Date.now(),entry=buckets.get(ip)||{reset:now+60000,count:0};
 if(now>entry.reset){entry.count=0;entry.reset=now+60000;}
 entry.count++;buckets.set(ip,entry);
 if(buckets.size>500){for(const [key,value] of buckets)if(now>value.reset)buckets.delete(key);}
 return entry.count<=12;
}
async function readWikidata(id){
 const params=new URLSearchParams({action:"wbgetentities",ids:id,props:"claims",format:"json"});
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),6500);
 try{
  const response=await fetch("https://www.wikidata.org/w/api.php?"+params,{method:"GET",redirect:"error",
   headers:{Accept:"application/json","User-Agent":"UlabRepairProof/0.1 (public record verification)"},signal:controller.signal});
  if(!response.ok)throw new Error("Knowledge source returned HTTP "+response.status);
  if(Number(response.headers.get("content-length")||0)>350000)throw new Error("Knowledge response is too large.");
  const body=await response.text();
  if(body.length>350000)throw new Error("Knowledge response is too large.");
  return JSON.parse(body)?.entities?.[id];
 }finally{clearTimeout(timer);}
}
export default async function handler(req,res){
 res.setHeader("Cache-Control","no-store");
 res.setHeader("X-Content-Type-Options","nosniff");
 if(req.method!=="POST"){res.setHeader("Allow","POST");return res.status(405).json({error:"Use POST."});}
 if(!permitted(req))return res.status(429).json({error:"Too many verification requests. Try again shortly."});
 let input;
 try{
  const body=typeof req.body==="string"?JSON.parse(req.body):req.body||{};
  if(JSON.stringify(body).length>1600)throw new Error("Verification request is too large.");
  input=parseProofRequest(body);
 }catch(error){return res.status(400).json({error:String(error?.message||"Invalid verification request.")});}
 try{
  if(input.platform==="website"){
   const page=await inspectPublicHomepage(input.url);
   if(!page.ok)return res.status(200).json({status:"unavailable",url:input.url,checkedAt:new Date().toISOString(),error:page.error||"Site could not be read.",method:"direct_public_read"});
   return res.status(200).json(verifyWebsite(page.parsed,input));
  }
  const entity=await readWikidata(input.id);
  return res.status(200).json(verifyWikidata(entity,input));
 }catch(error){
  return res.status(200).json({status:"unavailable",url:input.url,checkedAt:new Date().toISOString(),error:String(error?.message||"Public source unavailable.").slice(0,160),method:"direct_public_read"});
 }
}
