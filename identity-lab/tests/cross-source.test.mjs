import test from "node:test";
import assert from "node:assert/strict";
import {extractWikidataClaims,enrichWikidataCandidates,cleanOpenAlexAuthors,normalizeOpenAlexId,normalizeOrcidId,buildIdentityGraph} from "../lib/cross-source.mjs";
import {draftOpportunities} from "../public/repair-opportunities.mjs";
import {makeTask} from "../public/identity-engine.mjs";
const person="Jordan Researcher",qid="Q123";
const wikiUrl="https://www.wikidata.org/wiki/Q123";
const openalexId="A5023888391";
const orcid="0000-0002-1825-0097";
const claim=value=>({mainsnak:{datavalue:{value}}});
const source={Q123:{claims:{P345:[claim("nm12345")],P4985:[claim("9842")],P10283:[claim(openalexId)],P856:[claim("https://jordan.example.org")],P496:[]}}};
test("Wikidata identifiers create platform links, not unchecked platform facts",()=>{
 const record=extractWikidataClaims(source.Q123);
 assert.equal(record.identifiers.imdb[0],"nm12345");
 assert.equal(record.identifiers.tmdb[0],"9842");
 assert.equal(record.identifiers.openalex[0],openalexId);
 assert.ok(record.profiles.some(x=>x.platform==="TMDb"));
 assert.ok(record.profiles.every(x=>x.checkedAtSource===false));
});
test("name-only candidate stays unverified while linked profiles remain visible",()=>{
 const [person]=enrichWikidataCandidates([{id:qid,label:"Jordan Researcher",url:wikiUrl,status:"unverified"}],source,null);
 assert.equal(person.status,"unverified");
 assert.equal(person.identifiers.imdb[0],"nm12345");
 assert.equal(person.officialWebsites[0],"https://jordan.example.org/");
 const graph=buildIdentityGraph([person],[]);
 assert.ok(graph.nodes.some(n=>n.key==="imdb:nm12345"));
 assert.ok(graph.edges.some(e=>e.type==="public_wikidata_identifier"));
 assert.equal(graph.comparisons.length,0);
});
test("anchor matches exact IMDb ID; namesakes do not auto-link",()=>{
 const candidates=[{id:qid,label:person,url:wikiUrl,status:"unverified"}];
 const [linked]=enrichWikidataCandidates(candidates,source,"https://www.imdb.com/name/nm12345/");
 assert.equal(linked.match,"identifier_linked");
 const [other]=enrichWikidataCandidates(candidates,source,"https://www.imdb.com/name/nm99999/");
 assert.equal(other.match,"name_only");
});
test("ORCID checksum rejects fabricated values",()=>{
 assert.equal(normalizeOrcidId(orcid),orcid);
 assert.equal(normalizeOrcidId("0000-0002-1825-0098"),null);
 assert.equal(normalizeOpenAlexId("https://openalex.org/"+openalexId),openalexId);
});
test("OpenAlex results only accepted with exact name, no fuzzy false identity",()=>{
 const candidates=cleanOpenAlexAuthors({results:[
  {id:"https://openalex.org/"+openalexId,display_name:person,ids:{orcid:"https://orcid.org/"+orcid,observed_orcids:[]},works_count:12},
  {id:"https://openalex.org/A5012345678",display_name:"Different Person",orcid:"https://orcid.org/"+orcid}
 ]},person);
 assert.equal(candidates.length,1);
 assert.equal(candidates[0].orcid,orcid);
 assert.equal(candidates[0].status,"unverified");
});
test("linked records with missing ORCID generate review comparison but never submit",()=>{
 const [wiki]=enrichWikidataCandidates([{id:qid,label:person,url:wikiUrl,status:"unverified"}],source,null);
 const [alex]=cleanOpenAlexAuthors({results:[{id:"https://openalex.org/"+openalexId,display_name:person,orcid:"https://orcid.org/"+orcid}]},person);
 const graph=buildIdentityGraph([wiki],[alex]);
 assert.equal(graph.comparisons[0].kind,"possible_missing_orcid");
 assert.equal(graph.comparisons[0].autoSubmit,false);
 const report={subject:{name:person,link:null,linkType:null},candidates:{wikidata:[wiki]},identityGraph:graph};
 assert.deepEqual(draftOpportunities(report),[]);
 const review={[wiki.url]:{decision:"self_reported_match"}};
 const [draft]=draftOpportunities(report,{reviews:review});
 assert.equal(draft.discrepancyType,"possible_missing_orcid");
 assert.equal(draft.platform,"wikidata");
 const task=makeTask({subject:draft.subject,platform:draft.platform,profileUrl:draft.profileUrl,current:draft.current,desired:draft.desired,evidence:draft.evidence});
 assert.equal(task.status,"needs_evidence");
 assert.ok(task.missing.some(x=>x.includes("independent")));
});
test("different ORCIDs are flagged but not treated as proven false credits",()=>{
 const changed={Q123:{claims:{...source.Q123.claims,P496:[claim("0000-0002-1694-233X")]}}};
 const [wiki]=enrichWikidataCandidates([{id:qid,label:person,url:wikiUrl}],changed,null);
 const [alex]=cleanOpenAlexAuthors({results:[{id:"https://openalex.org/"+openalexId,display_name:person,orcid:"https://orcid.org/"+orcid}]},person);
 const graph=buildIdentityGraph([wiki],[alex]);
 assert.ok(graph.comparisons.some(x=>x.kind==="possible_orcid_conflict"));
});
test("unconnected OpenAlex name matches cannot trigger cross-source discrepancy",()=>{
 const [wiki]=enrichWikidataCandidates([{id:qid,label:person,url:wikiUrl}],{Q123:{claims:{P856:[claim("https://jordan.example.org")]}}},null);
 const [alex]=cleanOpenAlexAuthors({results:[{id:"https://openalex.org/"+openalexId,display_name:person,orcid:"https://orcid.org/"+orcid}]},person);
 const graph=buildIdentityGraph([wiki],[alex]);
 assert.equal(graph.comparisons.length,0);
 assert.equal(graph.edges.length,0);
});
