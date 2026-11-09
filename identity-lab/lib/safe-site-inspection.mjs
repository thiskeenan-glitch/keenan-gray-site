// Bounded, read-only homepage inspector for customer-supplied public websites.
// DNS addresses are vetted and then pinned for the HTTPS connection to prevent SSRF/DNS rebinding.
import https from "node:https";
import {lookup} from "node:dns/promises";
import {BlockList} from "node:net";
import {safePublicUrl,extractSite} from "./identity-discovery.mjs";

const deny4=new BlockList();
for(const [ip,bits] of [["0.0.0.0",8],["10.0.0.0",8],["100.64.0.0",10],["127.0.0.0",8],["169.254.0.0",16],["172.16.0.0",12],["192.0.0.0",24],["192.0.2.0",24],["192.168.0.0",16],["198.18.0.0",15],["198.51.100.0",24],["203.0.113.0",24],["224.0.0.0",4],["240.0.0.0",4]]){
 deny4.addSubnet(ip,bits,"ipv4");
}
const allow6=new BlockList();allow6.addSubnet("2000::",3,"ipv6");
const deny6=new BlockList();
for(const [ip,bits] of [["2001::",23],["2001:db8::",32],["2002::",16]]){
 deny6.addSubnet(ip,bits,"ipv6");
}
export function isRoutableAddress(address,family){
 if(family===4)return !deny4.check(address,"ipv4");
 if(family===6)return allow6.check(address,"ipv6")&&!deny6.check(address,"ipv6");
 return false;
}
export async function resolvePublicAddresses(hostname,{resolver=lookup}={}){
 const addresses=await resolver(hostname,{all:true,verbatim:true});
 if(!Array.isArray(addresses)||!addresses.length)throw new Error("Public website DNS lookup failed.");
 // Reject mixed public/private DNS answers, not just the chosen address.
 if(addresses.some(({address,family})=>!isRoutableAddress(address,family)))throw new Error("Website DNS includes an unsafe address; scan blocked.");
 return addresses;
}
function sameSite(a,b){
 return a.hostname.toLowerCase().replace(/^www\./,"")===b.hostname.toLowerCase().replace(/^www\./,"");
}
function pinnedHttpsRequest(url,addresses,{requester=https.request,maxBytes=260000,timeoutMs=6500}={}){
 const pinned=addresses.find(x=>x.family===4)||addresses[0];
 return new Promise((resolve,reject)=>{
  let settled=false;
  const finish=(error,value)=>{if(settled)return;settled=true;error?reject(error):resolve(value);};
  const req=requester({
   protocol:"https:",hostname:url.hostname,port:443,path:url.pathname+url.search,method:"GET",agent:false,
   servername:url.hostname,timeout:timeoutMs,
   headers:{"Accept":"text/html,application/xhtml+xml;q=0.9","User-Agent":"UlabPilot/0.4 (public identity homepage audit)"},
   lookup:(hostname,options,cb)=>{
    if(typeof options==="function"){cb=options;options={};}
    if(options?.all)cb(null,[pinned]);else cb(null,pinned.address,pinned.family);
   }
  },response=>{
   const code=response.statusCode||0;
   if([301,302,303,307,308].includes(code)){
    response.resume();finish(null,{status:code,redirect:response.headers.location||null});return;
   }
   if(code!==200){response.resume();finish(new Error("Website returned HTTP "+code));return;}
   const type=String(response.headers["content-type"]||"").split(";")[0].toLowerCase();
   if(type&&type!=="text/html"&&type!=="application/xhtml+xml"){
    response.resume();finish(new Error("Homepage did not return HTML."));return;
   }
   const chunks=[];let length=0;
   response.on("data",chunk=>{
    length+=chunk.length;
    if(length>maxBytes){response.destroy(new Error("Homepage exceeds the bounded scan size."));return;}
    chunks.push(chunk);
   });
   response.on("end",()=>finish(null,{status:code,html:Buffer.concat(chunks).toString("utf8")}));
   response.on("error",error=>finish(error));
  });
  req.on("timeout",()=>req.destroy(new Error("Website scan timed out.")));
  req.on("error",error=>finish(error));
  req.end();
 });
}
export async function inspectPublicHomepage(inputUrl,{resolver=lookup,requester=https.request}={}){
 let start;
 try{start=new URL(safePublicUrl(inputUrl));}
 catch(error){return {ok:false,url:String(inputUrl||"").slice(0,200),error:error.message};}
 let current=start;
 for(let redirect=0;redirect<3;redirect++){
  try{
   const addresses=await resolvePublicAddresses(current.hostname,{resolver});
   const response=await pinnedHttpsRequest(current,addresses,{requester});
   if(response.redirect){
    const next=new URL(response.redirect,current);
    // Redirect only within the original apex/www site, never to a new domain.
    if(!sameSite(start,next))throw new Error("Homepage redirects outside the supplied website.");
    current=new URL(safePublicUrl(next.href));
    continue;
   }
   const parsed=extractSite(response.html,current.href);
   return {ok:true,url:current.href,parsed,inspection:"single_public_homepage",scope:"homepage_only"};
  }catch(error){
   return {ok:false,url:current.href,error:String(error?.message||"Website inspection failed").slice(0,180)};
  }
 }
 return {ok:false,url:start.href,error:"Too many website redirects."};
}
