import test from "node:test";
import assert from "node:assert/strict";
import handler from "../api/identity-config.js";
import {validPublicConfig,cleanCaseFields,cleanNote,statusLabel} from "../public/account-model.mjs";
const settings=()=>({url:process.env.IDLAB_SUPABASE_URL,key:process.env.IDLAB_SUPABASE_PUBLISHABLE_KEY});
function restore(values){if(values.url===undefined)delete process.env.IDLAB_SUPABASE_URL;else process.env.IDLAB_SUPABASE_URL=values.url;if(values.key===undefined)delete process.env.IDLAB_SUPABASE_PUBLISHABLE_KEY;else process.env.IDLAB_SUPABASE_PUBLISHABLE_KEY=values.key;}
async function request(method="GET"){
 const result={setHeader(){return this;},status(code){this.code=code;return this;},json(data){this.body=data;return this;}};
 await handler({method},result);return result;
}
test("public config defaults to disabled and never exposes secrets",async()=>{
 const initial=settings();try{
  delete process.env.IDLAB_SUPABASE_URL;delete process.env.IDLAB_SUPABASE_PUBLISHABLE_KEY;
  process.env.IDLAB_SECRET_KEY="fake_server_secret";
  const out=await request();
  assert.equal(out.code,200);assert.deepEqual(out.body,{enabled:false});
  assert.equal(JSON.stringify(out.body).includes("fake_server_secret"),false);
 }finally{restore(initial);delete process.env.IDLAB_SECRET_KEY;}
});
test("invalid project URL cannot enable authentication",async()=>{
 const initial=settings();try{
  process.env.IDLAB_SUPABASE_URL="https://evil.example";
  process.env.IDLAB_SUPABASE_PUBLISHABLE_KEY="sb_publishable_123456789abcdefghij";
  assert.deepEqual((await request()).body,{enabled:false});
  process.env.IDLAB_SUPABASE_URL="https://project.supabase.co";
  assert.equal((await request()).body.enabled,true);
 }finally{restore(initial);}
});
test("refuse config other than GET",async()=>{
 const r=await request("POST");assert.equal(r.code,405);
});
test("reject fake credentials and configuration hosts",()=>{
 assert.equal(validPublicConfig({enabled:true,url:"https://evil.example/",publishableKey:"sb_publishable_validlongvalue"}),false);
 assert.equal(validPublicConfig({enabled:true,url:"https://abc.supabase.co/",publishableKey:"sb_secret_invalid_secret"}),false);
 assert.equal(validPublicConfig({enabled:true,url:"https://abc.supabase.co/",publishableKey:"sb_publishable_abc123def456"}),true);
});
test("case input is minimal and validated",()=>{
 const x=cleanCaseFields({subject:" Jane Filmmaker ",website_url:"https://example.com/profile",summary:"My film credits are wrong."});
 assert.equal(x.subject,"Jane Filmmaker");assert.equal(x.website_url,"https://example.com/profile");
 assert.throws(()=>cleanCaseFields({subject:"X",summary:""}));
 assert.throws(()=>cleanCaseFields({subject:"Jane",website_url:"http://example.com"}));
 assert.throws(()=>cleanCaseFields({subject:"Jane",website_url:"https://localhost/page"}));
 assert.equal(cleanCaseFields({subject:"Jane",summary:""}).website_url,null);
});
test("notes reject empties and excessive content",()=>{
 assert.equal(cleanNote(" Source correction evidence "),"Source correction evidence");
 assert.throws(()=>cleanNote("x"));
 assert.throws(()=>cleanNote("a".repeat(3001)));
 assert.equal(statusLabel("submitted"),"Submission recorded");
});
