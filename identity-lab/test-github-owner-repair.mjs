import test from "node:test";
import assert from "node:assert/strict";
import {seal,unseal,oauthConfig,readSession,requireSameOrigin,startLogin} from "./lib/github-session.mjs";
import {applyPlan,publicPlan} from "./lib/repair-execution-plans.mjs";
import authHandler from "./api/github-auth.js";
import repairHandler from "./api/github-owner-repair.js";

const env={
 IDLAB_PUBLIC_ORIGIN:"https://identity-lab-pilot.vercel.app",
 IDLAB_GITHUB_OAUTH_CLIENT_ID:"Iv12345678901234",
 IDLAB_GITHUB_OAUTH_CLIENT_SECRET:"example-secret-example-secret",
 IDLAB_SESSION_SECRET:"this-is-a-long-unique-test-only-secret-1234567890",
 IDLAB_GITHUB_ALLOWED_USER:"thiskeenan-glitch"
};
function mockRes(){
 return {code:200,headers:{},body:null,ended:false,setHeader(k,v){this.headers[k]=v;},
 status(n){this.code=n;return this;},json(data){this.body=data;return this;},
 writeHead(n,headers){this.code=n;this.redirect=headers.Location;},end(){this.ended=true;}};
}
test("Owner patch changes only the exact current Filmshow role",()=>{
 const before='<div><p><span>Role</span>Founder / Director</p></div>';
 const result=applyPlan("filmshow-role-002",before.padEnd(120," "));
 assert.equal(result.changed,true);
 assert.match(result.content,/Co-Founder \/ Creative Director/);
 assert.equal(applyPlan("filmshow-role-002",result.content).changed,false);
 assert.throws(()=>applyPlan("filmshow-role-002",before.replace("Founder / Director","Other").padEnd(120," ")));
 assert.equal(publicPlan("filmshow-role-002").nextStep.includes("GitHub"),true);
});
test("Encrypted session rejects tampering and expiry",()=>{
 const now=Date.now(),secret=env.IDLAB_SESSION_SECRET;
 const good=seal({kind:"github",login:env.IDLAB_GITHUB_ALLOWED_USER,token:"test-token",expires:now+2000},secret);
 assert.equal(unseal(good,secret)?.token,"test-token");
 assert.equal(unseal(good+"tampered",secret),null);
 const expired=seal({kind:"github",login:env.IDLAB_GITHUB_ALLOWED_USER,token:"test-token",expires:now-5},secret);
 assert.equal(unseal(expired,secret),null);
 const config=oauthConfig(env);
 assert.ok(config);
 assert.equal(readSession({headers:{cookie:"__Host-ulab_github="+good}},config)?.login,env.IDLAB_GITHUB_ALLOWED_USER);
 assert.equal(readSession({headers:{}},config),null);
});
test("Only exact same-origin JSON approval passes CSRF gate",()=>{
 const config=oauthConfig(env);
 assert.equal(requireSameOrigin({headers:{origin:config.origin,"content-type":"application/json"}},config),true);
 assert.equal(requireSameOrigin({headers:{origin:"https://attacker.example","content-type":"application/json"}},config),false);
 assert.equal(requireSameOrigin({headers:{"content-type":"application/json"}},config),false);
 const auth=startLogin(config);
 assert.match(auth.url,/github\.com\/login\/oauth\/authorize/);
 assert.ok(!auth.url.includes(env.IDLAB_GITHUB_OAUTH_CLIENT_SECRET));
});
test("Auth and edit APIs stay closed when server configuration is missing",async()=>{
 const keys=Object.keys(env);const prior=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
 try{
  for(const k of keys)delete process.env[k];
  const auth=mockRes(),repair=mockRes();
  await authHandler({method:"GET",query:{action:"status"},headers:{}},auth);
  await repairHandler({method:"POST",query:{},headers:{},body:{}},repair);
  assert.equal(auth.code,503);
  assert.equal(repair.code,503);
 }finally{
  for(const k of keys){if(prior[k]===undefined)delete process.env[k];else process.env[k]=prior[k];}
 }
});
