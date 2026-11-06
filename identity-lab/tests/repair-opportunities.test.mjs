import test from "node:test";
import assert from "node:assert/strict";
import {draftOpportunities} from "../public/repair-opportunities.mjs";
import {makeTask,makePacket} from "../public/identity-engine.mjs";
import {identifyWikidataAnchors,cleanWikidataSearch} from "../lib/identity-discovery.mjs";
const site="https://example.org/about";
function makeReport({link=site,linkType="website",candidates=[{id:"Q123",url:"https://www.wikidata.org/wiki/Q123",label:"Jane Director",officialWebsites:[]}] }={}){
 return {subject:{name:"Jane Director",link,linkType},candidates:{wikidata:candidates}};
}
const approved={"https://www.wikidata.org/wiki/Q123":{decision:"self_reported_match",basis:"customer_self_report_only"}};
test("no correction without customer selecting the exact source record",()=>{
 const r=makeReport();assert.deepEqual(draftOpportunities(r),[]);
 assert.deepEqual(draftOpportunities(r,{reviews:{"https://www.wikidata.org/wiki/Q123":{decision:"self_reported_not_match"}}}),[]);
});
test("no inferred repair from a name alone or profile-only input",()=>{
 assert.deepEqual(draftOpportunities(makeReport({link:null,linkType:null}),{reviews:approved}),[]);
 assert.deepEqual(draftOpportunities(makeReport({link:"https://www.imdb.com/name/nm12345/",linkType:"profile"}),{reviews:approved}),[]);
});
test("existing official site is considered connected, not a discrepancy",()=>{
 const r=makeReport({candidates:[{id:"Q123",url:"https://www.wikidata.org/wiki/Q123",officialWebsites:["https://www.example.org/old-portfolio"]}]});
 assert.equal(draftOpportunities(r,{reviews:approved}).length,0);
});
test("different official site creates cautious review-only draft with both sources",()=>{
 const r=makeReport({candidates:[{id:"Q123",url:"https://www.wikidata.org/wiki/Q123",officialWebsites:["https://oldportfolio.org/"]}]});
 const [opportunity]=draftOpportunities(r,{reviews:approved});
 assert.equal(opportunity.discrepancyType,"possible_official_site_conflict");
 assert.equal(opportunity.platform,"wikidata");
 assert.equal(opportunity.submissionPerformed,false);
 assert.equal(opportunity.approvalRequired,true);
 assert.equal(opportunity.evidence.length,2);
 const caseTask=makeTask({subject:opportunity.subject,platform:opportunity.platform,profileUrl:opportunity.profileUrl,current:opportunity.current,desired:opportunity.desired,evidence:opportunity.evidence});
 assert.equal(caseTask.status,"needs_evidence");
 assert.match(makePacket(caseTask),/No platform account was accessed and no edit was submitted/i);
});
test("absent Wikidata P856 is an unverified omission, not a proven error",()=>{
 const [suggestion]=draftOpportunities(makeReport(),{reviews:approved});
 assert.equal(suggestion.discrepancyType,"possibly_missing_official_site");
 assert.match(suggestion.current,/absence needs independent verification/i);
 assert.match(suggestion.caveat,/independent corroboration/i);
});
test("malformed candidate URL or unsupported Q identifier is ignored",()=>{
 const r=makeReport({candidates:[{id:"Q123",url:"https://evil.example.org/Q123"},{id:"Q0",url:"https://www.wikidata.org/wiki/Q0"}]});
 assert.equal(draftOpportunities(r,{reviews:approved}).length,0);
});
test("Wikidata public claims supply existing official website observations",()=>{
 const input=cleanWikidataSearch({search:[{id:"Q123",label:"Jane Director"}]},"Jane Director");
 const output=identifyWikidataAnchors(input,{Q123:{claims:{P856:[{mainsnak:{datavalue:{value:"https://oldportfolio.org/"}}}]}}},site);
 assert.deepEqual(output[0].officialWebsites,["https://oldportfolio.org/"]);
 assert.equal(output[0].status,"unverified");
});
