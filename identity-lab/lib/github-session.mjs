// Private beta GitHub OAuth with a short-lived encrypted, HttpOnly session.
// Tokens never reach browser JavaScript, reports, logs, or URL parameters.
import {createHash, createCipheriv, createDecipheriv, randomBytes, timingSafeEqual} from "node:crypto";
export const SESSION_COOKIE="__Host-ulab_github";
export const STATE_COOKIE="__Host-ulab_oauth_state";
const makeKey=(s)=>createHash("sha256").update(s,"utf8").digest();
const base64=(b)=>Buffer.from(b).toString("base64url");
function parseCookies(req){
 const out={};
 for(const part of String(req.headers?.cookie||"").split(";")){
  const p=part.indexOf("=");if(p<1)continue;
  const k=part.slice(0,p).trim();if(!k||Object.hasOwn(out,k))continue;
  out[k]=part.slice(p+1).trim();
 }
 return out;
}
function safeEqual(a,b){
 if(typeof a!=="string"||typeof b!=="string"||a.length!==b.length||a.length>512)return false;
 return timingSafeEqual(Buffer.from(a),Buffer.from(b));
}
export function oauthConfig(env=process.env){
 const origin=String(env.IDLAB_PUBLIC_ORIGIN||"").replace(/\/$/,"");
 const id=String(env.IDLAB_GITHUB_OAUTH_CLIENT_ID||"");
 const secret=String(env.IDLAB_GITHUB_OAUTH_CLIENT_SECRET||"");
 const sessionSecret=String(env.IDLAB_SESSION_SECRET||"");
 const owner=String(env.IDLAB_GITHUB_ALLOWED_USER||"").trim();
 try{
  const u=new URL(origin);
  if(u.protocol!=="https:"||u.origin!==origin||u.username||u.password||u.search||u.hash||
   !/^[a-zA-Z0-9_-]{8,}$/.test(id)||secret.length<16||sessionSecret.length<32||
   !/^[a-zA-Z0-9-]{1,39}$/.test(owner))return null;
 }catch{return null;}
 return {origin,id,secret,sessionSecret,owner};
}
export function seal(payload,secret){
 const iv=randomBytes(12),cipher=createCipheriv("aes-256-gcm",makeKey(secret),iv);
 const body=Buffer.concat([cipher.update(JSON.stringify(payload),"utf8"),cipher.final()]);
 return [base64(iv),base64(cipher.getAuthTag()),base64(body)].join(".");
}
export function unseal(value,secret){
 try{
  if(typeof value!=="string"||value.length>3500)return null;
  const parts=value.split(".");if(parts.length!==3)return null;
  const iv=Buffer.from(parts[0],"base64url"),tag=Buffer.from(parts[1],"base64url");
  if(iv.length!==12||tag.length!==16)return null;
  const dec=createDecipheriv("aes-256-gcm",makeKey(secret),iv);dec.setAuthTag(tag);
  const obj=JSON.parse(Buffer.concat([dec.update(Buffer.from(parts[2],"base64url")),dec.final()]).toString("utf8"));
  if(!obj||!Number.isSafeInteger(obj.expires)||obj.expires<=Date.now())return null;
  return obj;
 }catch{return null;}
}
export function setCookie(name,value,maxAge){
 return name+"="+value+"; Path=/; Max-Age="+maxAge+"; HttpOnly; Secure; SameSite=Lax";
}
export function clearCookie(name){
 return name+"=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax";
}
export function readSession(req,config){
 const saved=unseal(parseCookies(req)[SESSION_COOKIE],config.sessionSecret);
 if(!saved||!saved.token||!safeEqual(saved.login,config.owner)||saved.kind!=="github")return null;
 return saved;
}
export function requireSameOrigin(req,config){
 return String(req.headers?.origin||"")===config.origin &&
  String(req.headers?.["sec-fetch-site"]||"same-origin")!=="cross-site" &&
  /^application\/json(?:;|$)/i.test(String(req.headers?.["content-type"]||""));
}
export function startLogin(config){
 const state=base64(randomBytes(32)),verifier=base64(randomBytes(32));
 const challenge=base64(createHash("sha256").update(verifier).digest());
 const oauthUrl=new URL("https://github.com/login/oauth/authorize");
 oauthUrl.searchParams.set("client_id",config.id);
 oauthUrl.searchParams.set("redirect_uri",config.origin+"/api/github-auth?action=callback");
 oauthUrl.searchParams.set("scope","public_repo");
 oauthUrl.searchParams.set("state",state);
 oauthUrl.searchParams.set("code_challenge",challenge);
 oauthUrl.searchParams.set("code_challenge_method","S256");
 oauthUrl.searchParams.set("allow_signup","false");
 const saved=seal({state,verifier,kind:"oauth",expires:Date.now()+600000},config.sessionSecret);
 return {url:oauthUrl.href,cookie:setCookie(STATE_COOKIE,saved,600)};
}
export function finishLoginState(req,config,returnedState){
 const saved=unseal(parseCookies(req)[STATE_COOKIE],config.sessionSecret);
 if(!saved||saved.kind!=="oauth"||!safeEqual(saved.state,returnedState)||!saved.verifier)return null;
 return saved.verifier;
}
async function fetchWithLimit(url,opts={}){
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),10000);
 try{
  const result=await fetch(url,{...opts,redirect:"error",signal:ctrl.signal});
  const text=await result.text();if(text.length>100000)throw Error("GitHub response too large.");
  let json;try{json=JSON.parse(text);}catch{throw Error("GitHub returned an invalid response.");}
  if(!result.ok)throw Error("GitHub authorization failed (HTTP "+result.status+").");
  return json;
 }finally{clearTimeout(timer);}
}
export async function exchangeCode(config,code,verifier){
 if(!/^[a-zA-Z0-9_-]{8,500}$/.test(code||""))throw Error("Invalid authorization response.");
 const response=await fetchWithLimit("https://github.com/login/oauth/access_token",{
  method:"POST",
  headers:{Accept:"application/json","Content-Type":"application/json"},
  body:JSON.stringify({client_id:config.id,client_secret:config.secret,code,
   redirect_uri:config.origin+"/api/github-auth?action=callback",code_verifier:verifier})
 });
 if(!response.access_token||response.token_type?.toLowerCase()!=="bearer"||
  !String(response.scope||"").split(",").includes("public_repo"))
  throw Error("GitHub did not grant public-repository access.");
 return response.access_token;
}
export async function githubIdentity(token){
 const user=await fetchWithLimit("https://api.github.com/user",{
  headers:{Authorization:"Bearer "+token,Accept:"application/vnd.github+json",
   "X-GitHub-Api-Version":"2022-11-28","User-Agent":"UlabRepairPilot/1.0"}
 });
 if(!user||typeof user.login!=="string")throw Error("GitHub account could not be verified.");
 return {login:user.login,id:user.id};
}
export function sessionCookie(config,token,login){
 return setCookie(SESSION_COOKIE,seal({
  kind:"github",token,login,expires:Date.now()+2*60*60*1000
 },config.sessionSecret),7200);
}
