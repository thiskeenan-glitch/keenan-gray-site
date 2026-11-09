// Ulab account-private graph storage. Supabase publishable key and Auth JWT only.
// No service role, no anonymous read/write, no automatic sharing, no external edits.
import {validPublicConfig} from "/account-model.mjs";

let clientPromise=null;
function sdk(){
 return new Promise((resolve,reject)=>{
  if(window.supabase?.createClient)return resolve(window.supabase);
  const src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.0/dist/umd/supabase.min.js";
  const tag=document.createElement("script");
  tag.src=src;tag.crossOrigin="anonymous";tag.referrerPolicy="no-referrer";
  tag.onload=()=>window.supabase?.createClient?resolve(window.supabase):reject(new Error("Account SDK did not initialize."));
  tag.onerror=()=>reject(new Error("Unable to load account SDK."));
  document.head.append(tag);
 });
}
async function getClient(){
 if(!clientPromise)clientPromise=(async()=>{
  const response=await fetch("/api/identity-config",{cache:"no-store"});
  if(!response.ok)throw Error("Account configuration is unavailable.");
  const config=await response.json();
  if(!validPublicConfig(config))throw Error("Private account sync is not enabled on this preview.");
  const lib=await sdk();
  return lib.createClient(config.url,config.publishableKey,{auth:{
   persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,flowType:"implicit"
  }});
 })().catch(e=>{clientPromise=null;throw e;});
 return clientPromise;
}
async function getSignedInClient(){
 const client=await getClient();
 const {data,error}=await client.auth.getUser();
 if(error||!data?.user)throw Error("Sign in at /account first, then return to this pilot page.");
 return {client,user:data.user};
}
export async function saveGraphToAccount(graph,comparison){
 if(!graph||graph.schemaVersion!==1||!graph.subject?.id)throw Error("No valid graph available to save.");
 const {client,user}=await getSignedInClient();
 const fields={
  owner_id:user.id,subject_key:graph.subject.id,subject_name:graph.subject.name,
  anchor_url:graph.subject.anchorUrl||null,graph,
  research_status:graph.research.status,updated_at:new Date().toISOString()
 };
 const {data,error}=await client.from("idlab_identity_graphs")
  .upsert(fields,{onConflict:"owner_id,subject_key"}).select("id").single();
 if(error)throw Error("Could not save identity graph: "+error.message);
 const {error:runError}=await client.from("idlab_identity_graph_runs").insert({
  owner_id:user.id,graph_id:data.id,snapshot:graph,change_summary:comparison||{}
 });
 if(runError)throw Error("Graph saved, but its monitoring snapshot failed: "+runError.message);
 return {saved:true,subjectName:graph.subject.name,graphId:data.id};
}
export async function loadGraphFromAccount(subjectId){
 if(!/^[a-z0-9][a-z0-9-]{1,89}$/.test(subjectId||""))throw Error("Invalid graph subject.");
 const {client}=await getSignedInClient();
 const {data,error}=await client.from("idlab_identity_graphs")
  .select("graph,updated_at").eq("subject_key",subjectId).maybeSingle();
 if(error)throw Error("Could not load graph: "+error.message);
 if(data?.graph?.schemaVersion!==1)return null;
 return {graph:data.graph,updatedAt:data.updated_at};
}
export async function accountIdentityState(){
 try{const {user}=await getSignedInClient();return {signedIn:true,email:user.email||null};}
 catch(e){return {signedIn:false,message:String(e.message||"Account sync unavailable")};}
}
