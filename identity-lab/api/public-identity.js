// Public, read-only Ulab-hosted identity record. Only published fields from anon RLS.
// Owner's accounts, audit data, contact details, and sessions are never queried.
import {parseSlug,profileHtml,safePublicFields} from "../lib/public-profile.mjs";

export async function readPublicIdentity(slug,{fetchImpl=fetch,url=process.env.IDLAB_SUPABASE_URL,key=process.env.IDLAB_SUPABASE_PUBLISHABLE_KEY}={}){
 const name=parseSlug(slug);
 if(typeof key!=="string"||!key.startsWith("sb_publishable_"))throw Error("Public identity service is not configured.");
 let base;
 try{base=new URL(url);if(base.protocol!=="https:"||!base.hostname.endsWith(".supabase.co"))throw Error();}
 catch{throw Error("Public identity service is not configured.");}
 const endpoint=new URL("/rest/v1/idlab_public_identities",base);
 endpoint.searchParams.set("select","slug,display_name,headline,website_url,profile_urls,state,version,published_at");
 endpoint.searchParams.set("slug","eq."+name);
 endpoint.searchParams.set("state","eq.published");
 endpoint.searchParams.set("limit","1");
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),5000);
 try{
  const response=await fetchImpl(endpoint.href,{method:"GET",redirect:"error",signal:controller.signal,
   headers:{apikey:key,Accept:"application/json"}});
  if(!response.ok)throw Error("Public identity lookup unavailable.");
  const raw=await response.text();
  if(raw.length>16000)throw Error("Public identity response too large.");
  const rows=JSON.parse(raw);
  const found=Array.isArray(rows)?rows[0]:null;
  return safePublicFields(found);
 }finally{clearTimeout(timer);}
}
const safeHost=req=>{
 const host=String(req.headers?.host||"").toLowerCase();
 return /^identity-lab-pilot(?:-[a-z0-9-]+)?\.vercel\.app$/.test(host)?"https://"+host:"https://identity-lab-pilot.vercel.app";
};
export default async function handler(req,res){
 res.setHeader("Cache-Control","no-store");
 res.setHeader("X-Content-Type-Options","nosniff");
 res.setHeader("X-Robots-Tag","noindex,nofollow");
 res.setHeader("Referrer-Policy","no-referrer");
 res.setHeader("X-Frame-Options","DENY");
 res.setHeader("Content-Security-Policy","default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'");
 if(req.method!=="GET"){res.setHeader("Allow","GET");return res.status(405).end();}
 let slug;try{slug=parseSlug(req.query?.slug);}catch{return res.status(404).end("No identity record found.");}
 try{
  const record=await readPublicIdentity(slug);
  if(!record)return res.status(404).end("No published identity record exists for this profile.");
  res.setHeader("Content-Type","text/html; charset=utf-8");
  return res.status(200).end(profileHtml(record,{origin:safeHost(req),preview:true}));
 }catch{return res.status(503).end("Public identity records are temporarily unavailable.");}
}
