import test from "node:test";
import assert from "node:assert/strict";
import {researchQueries,organizeWebResults,normalizeBraveResponse,visibilityQueries,sampledVisibility} from "../lib/web-research.mjs";
const identity={name:"Jane Director",link:"https://janedirector.example.net",anchor:{kind:"website"}};
const site={ok:true,parsed:{title:"Jane Director | Film Director",sameAs:["https://www.imdb.com/name/nm1234567/"],outlinks:["https://www.imdb.com/name/nm1234567/"]}};
test("bounded queries preserve name and add website and professional context",()=>{
 const q=researchQueries(identity,site);
 assert.ok(q.length>=2&&q.length<=4);
 assert.ok(q.every(v=>v.includes('"Jane Director"')));
 assert.ok(q.some(v=>v.includes("janedirector.example.net")));
});
test("search hits are deduplicated and evidence labels remain unverified",()=>{
 const batches=[{results:[
  {url:"https://www.imdb.com/name/nm1234567/",title:"Jane Director - IMDb",description:"Jane Director credits"},
  {url:"https://www.imdb.com/name/nm1234567/",title:"Jane Director - IMDb",description:"Jane Director filmmaker credits"},
  {url:"https://example.org/articles/jane-director",title:"Jane Director interview",description:"Film Director Jane Director"},
  {url:"https://other.example.net/story",title:"Unrelated Person",description:"No name overlap"}
 ]}];
 const result=organizeWebResults(batches,{...identity,site});
 assert.equal(result.results.length,2);
 assert.equal(result.results[0].connection,"linked");
 assert.equal(result.results[0].status,"unverified");
 assert.equal(result.results[0].queryHits,2);
 assert.ok(result.results.every(x=>Array.isArray(x.reasons)));
});
test("name-only collisions are never called verified",()=>{
 const result=organizeWebResults([{results:[{url:"https://example.com/jane",title:"Jane Director",description:"A completely different profession"}]}],{name:"Jane Director"});
 assert.equal(result.results.length,1);
 assert.equal(result.results[0].connection,"unverified");
 assert.equal(result.results[0].status,"unverified");
});
test("normalized search data cannot invent additional URLs",()=>{
 const rows=normalizeBraveResponse({web:{results:[{url:"https://example.org/",title:"Jane Director",description:"Film director"},{title:"Missing URL"}]}});
 assert.equal(rows.length,1);
 assert.equal(rows[0].url,"https://example.org/");
});

test("findability samples include explicit profession and location contexts",()=>{
 const input={name:"Sam Ferlo",link:"https://samferlo.com/",anchor:{kind:"website"}};
 const site={ok:true,parsed:{title:"Sam Ferlo — Actor. Clown.",heading:"Sam Ferlo — Actor and Clown",location:"New York, NY"}};
 const probes=visibilityQueries(input,site);
 assert.equal(probes.length,4);
 assert.ok(probes.some(x=>x.id==="discovery"&&x.query.includes("New York")));
 assert.ok(probes.some(x=>x.id==="name"&&x.query==='"Sam Ferlo"'));
});
test("sampled visibility counts only attributable sources and does not claim Google positions",()=>{
 const probes=[
  {id:"name",label:"Full name",query:'"Sam Ferlo"',status:"ok",results:[{url:"https://samferlo.com/",title:"Sam Ferlo actor",description:"Official website"}]},
  {id:"discovery",label:"Profession + location",query:"actor clown New York",status:"ok",results:[{url:"https://othersite.org/",title:"Other clown",description:"New York theatre"}]},
  {id:"location",label:"Name + location",query:'"Sam Ferlo" New York',status:"error",results:[]}
 ];
 const result=sampledVisibility(probes,{name:"Sam Ferlo",link:"https://samferlo.com/"});
 assert.equal(result.checked,2);
 assert.equal(result.appeared,1);
 assert.equal(result.score,50);
 assert.equal(result.rows[0].position,1);
 assert.equal(result.rows[1].found,false);
 assert.equal(result.rows[2].checked,false);
 assert.equal(result.notGoogle,true);
});
