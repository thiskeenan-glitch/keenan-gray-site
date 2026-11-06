import test from "node:test";
import assert from "node:assert/strict";
import {safePublicUrl,classifyLink,parseIntake,cleanWikidataSearch,identifyWikidataAnchors,cleanSearchResults,extractSite,reportFromSignals} from "../lib/identity-discovery.mjs";
import handler from "../api/discover.js";
const name="Keenan Gray",sample="https://www.imdb.com/name/nm16096261/";
test("name-only intake is supported without professional-specific fields",()=>{
 const x=parseIntake({name});assert.equal(x.name,name);assert.equal(x.link,null);assert.equal(x.anchor,null);
 assert.throws(()=>parseIntake({name:""}));
 assert.throws(()=>parseIntake({name:"  "}));
});
test("one optional website, LinkedIn, IMDb or portfolio link all work",()=>{
 for(const [url,kind,label] of [
 ["https://www.thiskeenan.com","website","Supplied website"],
 ["https://www.linkedin.com/in/jane-director","profile","LinkedIn"],
 [sample,"profile","IMDb"],
 ["https://myportfolio.org/people/jane","website","Supplied website"]
 ]){const x=parseIntake({name,link:url});assert.equal(x.anchor.kind,kind);assert.equal(x.anchor.label,label);}
});
test("unsafe external URLs are rejected",()=>{
 for(const u of ["http://example.com","https://localhost/","https://127.0.0.1/","https://169.254.169.254/","https://subdomain.local/","https://user:pass@example.com","https://example.com:8443","https://foo.test/","file:///etc/passwd"]){
  assert.throws(()=>safePublicUrl(u),undefined,u);
 }
});
test("name-only Wikidata matches are candidates not confirmations",()=>{
 const results=cleanWikidataSearch({search:[
 {id:"Q12",label:name,description:"Filmmaker"},
 {id:"Q13",label:"Other Person",description:"Director"},
 {id:"Q14",label:name,description:"Athlete"}
 ]},name);
 assert.equal(results.length,2);assert.equal(results[0].status,"unverified");
 const report=reportFromSignals({input:parseIntake({name}),wikidata:results,wikidataStatus:"ok"});
 assert.equal(report.results.find(x=>x.id==="wikidata").status,"manual");
 assert.ok(report.disclaimer.includes("candidates"));
});
test("explicit existing record identifiers can strengthen a candidate",()=>{
 const candidates=cleanWikidataSearch({search:[{id:"Q123",label:name}]},name);
 const entities={Q123:{claims:{P345:[{mainsnak:{datavalue:{value:"nm16096261"}}}]}}};
 const matches=identifyWikidataAnchors(candidates,entities,sample);
 assert.equal(matches[0].match,"identifier_linked");assert.equal(matches[0].status,"cross_linked");
 const noMatch=identifyWikidataAnchors(candidates,entities,"https://www.imdb.com/name/nm123456/");
 assert.equal(noMatch[0].status,"unverified");
});
test("search snippet is a candidate, never a verified identity",()=>{
 const results=cleanSearchResults({web:{results:[{url:"https://news.example.org/keenan",title:"Keenan Gray filmmaker",description:"An article about a filmmaker"},{url:"https://news.example.org/other",title:"Other person",description:"No relation"}]}},name);
 assert.equal(results.length,1);assert.equal(results[0].status,"unverified");
});
test("site signal extractor recognizes Person and avoids conflating names",()=>{
 const html='<script type="application/ld+json">{"@type":"Person","name":"Keenan Gray","sameAs":"https://www.imdb.com/name/nm16096261/"}</script><h1>Keenan Gray</h1><a href="https://example.com/portfolio">Portfolio</a>';
 const site=extractSite(html,"https://www.thiskeenan.com/");
 assert.equal(site.people[0].name,name);assert.equal(site.sameAs[0],sample);
 assert.equal(site.outlinks.length,1);
 const report=reportFromSignals({input:parseIntake({name,link:"https://www.thiskeenan.com"}),site:{ok:true,url:"https://www.thiskeenan.com",parsed:site},wikidata:[],wikidataStatus:"ok"});
 assert.equal(report.results.find(x=>x.id==="site_name").status,"pass");
});
const originalFetch=global.fetch;
async function call(body){
 const out={statusCode:0,setHeader(){},status(code){this.statusCode=code;return this;},json(data){this.value=data;return this;}};
 await handler({method:"POST",body,headers:{"x-forwarded-for":"test-"+Math.random()}},out);return out;
}
test("discovery endpoint returns read-only name-only report",async()=>{
 global.fetch=async url=>new Response(JSON.stringify({search:[{id:"Q123",label:name,description:"Filmmaker"}]}),{status:200,headers:{"content-type":"application/json"}});
 try{const result=await call({name});assert.equal(result.statusCode,200);assert.equal(result.value.subject.name,name);assert.equal(result.value.subject.link,null);assert.equal(result.value.candidates.wikidata[0].status,"unverified");}finally{global.fetch=originalFetch;}
});
test("discovery endpoint refuses malformed or unsafe input without fetching",async()=>{
 let count=0;global.fetch=async()=>{count++;throw new Error("network disallowed");};
 try{const r=await call({name,link:"http://localhost/"});assert.equal(r.statusCode,400);assert.equal(count,0);}finally{global.fetch=originalFetch;}
});
test("third-party data outage results in honest unknown, not fake success",async()=>{
 global.fetch=async()=>{throw new Error("service unavailable");};
 try{const r=await call({name,link:"https://www.linkedin.com/in/valid-profile/"});assert.equal(r.statusCode,200);assert.equal(r.value.coverage.wikidata,"error");assert.equal(r.value.results.find(x=>x.id==="panel").status,"manual");}finally{global.fetch=originalFetch;}
});
