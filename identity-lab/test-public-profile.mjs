import assert from "node:assert/strict";
import test from "node:test";
import {cleanIdentityInput,makeIdentityWrite,parseSlug,profileHtml,publicUrl,safePublicFields,verifyPublicPayload} from "./lib/public-profile.mjs";
import {readPublicIdentity} from "./api/public-identity.js";

const raw={
 slug:"river-founder",
 display_name:"River Parker",
 headline:"Designer, founder, and community organizer",
 website_url:"https://example.com/",
 profile_urls:["https://www.linkedin.com/in/riverparker/","https://www.imdb.com/name/nm12345678/"]
};
const published={...cleanIdentityInput(raw),state:"published",version:1,published_at:"2026-11-07T20:30:00.000Z"};
const response=(body,status=200)=>({ok:status>=200&&status<300,status,
 text:async()=>JSON.stringify(body)});
test("public identity writer requires explicit approval and valid URLs",()=>{
 assert.equal(parseSlug(raw.slug),raw.slug);
 assert.throws(()=>parseSlug("admin"));
 assert.throws(()=>parseSlug("River Founder"));
 assert.throws(()=>publicUrl("http://example.com"));
 assert.throws(()=>publicUrl("https://user:password@example.com"));
 assert.throws(()=>publicUrl("https://localhost/"));
 assert.throws(()=>publicUrl("https://127.0.0.1/"));
 const clean=cleanIdentityInput(raw);
 assert.deepEqual(clean.profile_urls,raw.profile_urls);
 assert.throws(()=>makeIdentityWrite(raw,null,{publish:true,attested:false}));
 const first=makeIdentityWrite(raw,null,{publish:true,attested:true});
 assert.equal(first.state,"published");
 assert.equal(first.version,1);
 assert.equal(first.owner_attestation,true);
 assert.ok(first.published_at);
 assert.equal(makeIdentityWrite(raw,first,{publish:true,attested:true}).version,2);
 assert.throws(()=>makeIdentityWrite({...raw,slug:"new-slug"},first,{publish:true,attested:true}));
});
test("HTML rendering escapes user text and script tags, is noindex and self-declared",()=>{
 const html=profileHtml({...published,headline:"<script>alert('oops')</script> My firm & me"},{origin:"https://identity-lab-pilot.vercel.app"});
 assert.match(html,/<meta name="robots" content="noindex,nofollow">/);
 assert.match(html,/Links and statements were submitted by the account holder/);
 assert.match(html,/<script type="application\/ld\+json">/);
 assert.match(html,/schema\.org/);
 assert.ok(!html.includes("<script>alert('oops')</script>"));
 assert.ok(html.includes("&lt;script&gt;alert(&#39;oops&#39;)&lt;/script&gt;"));
 assert.ok(html.includes("\\u003cscript\\u003e"));
 assert.throws(()=>profileHtml({...published,state:"draft"}));
});
test("only explicitly published public record is returned, and private columns are never requested",async()=>{
 let requested="";
 const found=await readPublicIdentity(raw.slug,{
  url:"https://sample.supabase.co",key:"sb_publishable_long_key_1234",
  fetchImpl:async(url,opts)=>{
   requested=url;
   assert.equal(opts.method,"GET");
   assert.ok(!opts.headers.Authorization);
   assert.equal(opts.headers.apikey,"sb_publishable_long_key_1234");
   return response([{...published,owner_id:"private-uuid",owner_attestation:true}]);
  }
 });
 const request=new URL(requested);
 assert.equal(request.searchParams.get("state"),"eq.published");
 assert.equal(request.searchParams.get("slug"),"eq.river-founder");
 assert.ok(!request.searchParams.get("select").includes("owner_id"));
 assert.ok(!request.searchParams.get("select").includes("owner_attestation"));
 assert.equal(found.display_name,published.display_name);
 assert.equal(Object.hasOwn(found,"owner_id"),false);
 assert.equal(Object.hasOwn(found,"owner_attestation"),false);
 const absent=await readPublicIdentity(raw.slug,{
  url:"https://sample.supabase.co",key:"sb_publishable_long_key_1234",
  fetchImpl:async()=>response([])
 });
 assert.equal(absent,null);
 assert.throws(()=>parseSlug("../../admin"));
 await assert.rejects(()=>readPublicIdentity("river-founder",{
  url:"http://sample.supabase.co",key:"sb_publishable_long_key_1234",
  fetchImpl:async()=>response([])
 }),/not configured/);
});
test("live public readback verifies exact fields and version, not merely record existence",()=>{
 const good=verifyPublicPayload(published,{...raw,version:1});
 assert.equal(good.matched,true);
 assert.equal(good.status,"verified_public_http");
 const wrong=verifyPublicPayload(published,{...raw,version:2,headline:"Wrong"});
 assert.equal(wrong.matched,false);
 assert.ok(wrong.mismatches.includes("version"));
 assert.ok(wrong.mismatches.includes("headline"));
 assert.equal(verifyPublicPayload({...published,state:"draft"},{...raw,version:1}).matched,false);
});
