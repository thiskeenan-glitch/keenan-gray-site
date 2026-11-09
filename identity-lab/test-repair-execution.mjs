import assert from "node:assert/strict";
import test from "node:test";
import {applyPlan,getPlan} from "./lib/repair-execution-plans.mjs";
import {executeApprovedRepair} from "./lib/github-repair-executor.mjs";
import listPlans from "./api/repair-plans.js";
import executeEndpoint from "./api/execute-repair.js";

const repo="thiskeenan-glitch/keenan-gray-site";
const prefix="https://api.github.com/repos/"+repo;
const fixture=[
 'export const metadata = {',
 '  title: "Me | Brooklyn Film Director",',
 '  openGraph: { title: "Me | Keenan Gray", },',
 '  twitter: { title: "Me | Keenan Gray", },',
 '  webPageSchema({ name: "Me | Keenan Gray", });',
 '  return <main><h1>Me</h1></main>;',
 '};',
 '// other site components remain unchanged'
].join("\n");
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json"}});
const pr=(number)=>({
 html_url:"https://github.com/"+repo+"/pull/"+number,number,state:"open",
 head:{ref:"ulab-first-website-repair",repo:{full_name:repo}},
 base:{ref:"main"}
});
function responseHarness(){
 return {statusCode:200,body:null,headers:{},setHeader(key,value){this.headers[key]=value;},
  status(code){this.statusCode=code;return this;},
  json(body){this.body=body;return this;}};
}
test("exact patch is idempotent, limited and refuses unknown plans",()=>{
 const result=applyPlan("about-identity-001",fixture);
 assert.equal(result.changed,true);
 assert.match(result.content,/<h1>Keenan Gray<\/h1>/);
 assert.match(result.content,/title: \{ absolute: "Keenan Gray \| Film Director" \}/);
 assert.equal(applyPlan("about-identity-001",result.content).changed,false);
 assert.throws(()=>applyPlan("invalid",fixture));
 assert.throws(()=>applyPlan("about-identity-001",fixture.replace('<h1>Me</h1>','<h1>Somebody else</h1>')));
});
test("already-open owner PR returns a review link with no GitHub writes",async()=>{
 const calls=[];
 const result=await executeApprovedRepair("about-identity-001",{
  token:"test-only-not-a-real-credential",
  fetchImpl:async (url,opts)=>{
   calls.push(opts.method+" "+url);
   assert.equal(url,prefix+"/pulls?state=open&head=thiskeenan-glitch%3Aulab-first-website-repair&base=main&per_page=10");
   assert.equal(opts.method,"GET");
   return reply([pr(11)]);
  }
 });
 assert.equal(result.status,"draft_pr_already_open");
 assert.equal(result.published,false);
 assert.equal(result.reviewUrl,"https://github.com/"+repo+"/pull/11");
 assert.equal(calls.length,1);
});
test("new approved repair creates a branch, exact patch and draft PR, never merges",async()=>{
 const calls=[]; const sha="a".repeat(40);
 const inputs={
  "GET /pulls?state=open&head=thiskeenan-glitch%3Aulab-first-website-repair&base=main&per_page=10":reply([]),
  "GET /git/ref/heads/ulab-first-website-repair":reply({message:"Not Found"},404),
  "GET /git/ref/heads/main":reply({object:{sha}}),
  "GET /contents/app/about/page.tsx?ref=main":reply({
   type:"file",sha:"blob-sha",encoding:"base64",content:Buffer.from(fixture).toString("base64")
  }),
  "POST /git/refs":reply({ref:"refs/heads/ulab-first-website-repair"}),
  "PUT /contents/app/about/page.tsx":reply({commit:{sha:"b".repeat(40)}}),
  "POST /pulls":reply(pr(42))
 };
 const result=await executeApprovedRepair("about-identity-001",{
  token:"test-only-not-a-real-credential",
  fetchImpl:async (url,opts)=>{
   const target=opts.method+" "+url.slice(prefix.length);calls.push(target);
   if(target==="POST /pulls"){const body=JSON.parse(opts.body);assert.equal(body.draft,true);assert.equal(body.base,"main");}
   if(target==="PUT /contents/app/about/page.tsx"){
    const body=JSON.parse(opts.body);const patched=Buffer.from(body.content,"base64").toString("utf8");
    assert.match(patched,/<h1>Keenan Gray<\/h1>/);
    assert.doesNotMatch(patched,/<h1>Me<\/h1>/);
   }
   assert.ok(inputs[target],target+" is not an approved route");return inputs[target];
  }
 });
 assert.equal(result.status,"draft_pr_created");
 assert.equal(result.published,false);
 assert.deepEqual(calls,[
  "GET /pulls?state=open&head=thiskeenan-glitch%3Aulab-first-website-repair&base=main&per_page=10",
  "GET /git/ref/heads/ulab-first-website-repair","GET /git/ref/heads/main",
  "GET /contents/app/about/page.tsx?ref=main","POST /git/refs",
  "PUT /contents/app/about/page.tsx","POST /pulls"
 ]);
});
test("public plan lookup only matches the narrow pilot identity",()=>{
 const run=query=>{const res=responseHarness();listPlans({method:"GET",query},res);return res;};
 assert.equal(run({name:"Keenan Gray",link:"https://www.thiskeenan.com"}).body.plans.length,1);
 assert.equal(run({name:"Sam Ferlo",link:"https://www.thiskeenan.com"}).body.plans.length,0);
 assert.equal(run({name:"Keenan Gray",link:"https://imdb.com/name/nm16096261/"}).body.plans.length,0);
 assert.equal(run({name:"Keenan Gray",link:"http://thiskeenan.com"}).body.plans.length,0);
});
test("execution endpoint stays disabled without explicit configured operator integration",async()=>{
 const old=process.env.IDLAB_REPAIR_EXECUTION_ENABLED;
 delete process.env.IDLAB_REPAIR_EXECUTION_ENABLED;
 try{
  const res=responseHarness();await executeEndpoint({method:"POST",headers:{},body:{planId:"about-identity-001",approval:"OWNER_APPROVED_DRAFT_PR"}},res);
  assert.equal(res.statusCode,503);assert.match(res.body.error,/not enabled/);
 }finally{if(old===undefined)delete process.env.IDLAB_REPAIR_EXECUTION_ENABLED;else process.env.IDLAB_REPAIR_EXECUTION_ENABLED=old;}
});
