import assert from "node:assert/strict";
import test from "node:test";
import {buildIdentityGraph,compareIdentityGraphs,graphPortfolio} from "./public/identity-graph.mjs";

const names=[["keenan-gray","Keenan Gray","https://www.thiskeenan.com/"],["sam-ferlo","Sam Ferlo",null],["liam-gundlach","Liam Gundlach",null],["davis-brown","Davis Brown",null]];
const reportFor=(name,link=null)=>({
 subject:{name,link},generatedAt:"2026-11-07T18:00:00Z",
 webResearch:{status:"ok",message:"Search completed; results are not verified identities."},
 candidates:{web:[],wikidata:[]},results:[],evidence:[]
});
const get=(id,name,link,report)=>buildIdentityGraph({personId:id,name,link,discovery:report||reportFor(name,link)});
test("one generic graph format supports exactly the four intended pilot subjects",()=>{
 const graphs=names.map(([id,name,link])=>get(id,name,link));
 assert.deepEqual(graphs.map(x=>x.subject.name),names.map(x=>x[1]));
 assert.equal(graphs.every(x=>x.schemaVersion===1),true);
 assert.equal(graphs.every(x=>x.overview.verifiedCorrections===0),true);
 const stats=graphPortfolio(graphs);
 assert.equal(stats.subjects,4);
 assert.equal(stats.verifiedCorrections,0);
});
test("same-name indexed leads remain uncertain, never inferred authorized profiles",()=>{
 const report=reportFor("Davis Brown");
 report.candidates.web=[
  {url:"https://www.eliteprospects.com/player/116975/davis-brown",title:"Davis Brown - hockey player",description:"Hockey prospect"},
  {url:"https://www.davisbrownmusic.com/",title:"Davis Brown music",description:"Music official page"}
 ];
 const g=get("davis-brown","Davis Brown",null,report);
 assert.equal(g.overview.unverifiedCandidates,2);
 assert.ok(g.nodes.filter(n=>n.type==="unverified_name_match").every(x=>
  !x.identityConfirmed&&!x.ownershipVerified&&!x.canEdit));
 assert.equal(g.repairs.length,0);
 assert.ok(g.edges.every(x=>x.certainty!=="verified_identity"));
});
test("sameAs on a scanned anchor is a crosslink, not account control",()=>{
 const r=reportFor("Keenan Gray","https://www.thiskeenan.com/");
 r.site={url:"https://www.thiskeenan.com/",parsed:{
  title:"Keenan Gray | Film Director",heading:"Keenan Gray",
  people:[{name:"Keenan Gray",description:"Director and writer"}],
  sameAs:["https://www.imdb.com/name/nm16096261/","https://www.instagram.com/thiskeenan/"],
  outlinks:[]}};
 r.intelligence={graph:{linked:[
  {url:"https://www.imdb.com/name/nm16096261/",title:"Keenan Gray - IMDb",description:"Director credits",match:"linked_from_anchor"}
 ]}};
 const g=get("keenan-gray","Keenan Gray","https://www.thiskeenan.com/",r);
 const imdb=g.nodes.find(n=>n.url==="https://www.imdb.com/name/nm16096261/");
 assert.equal(g.research.siteInspected,true);
 assert.equal(imdb.type,"site_sameas");
 assert.equal(imdb.ownershipVerified,false);
 assert.equal(imdb.canEdit,false);
 assert.equal(g.overview.linkedCandidates,2);
 assert.ok(g.edges.some(x=>x.kind==="publishes_sameas"));
 assert.ok(g.claims.some(x=>x.predicate==="professional_description"&&x.sourceUrl.includes("thiskeenan.com")));
});
test("factual conflicts are recorded as candidates with provenance, not completed edits",()=>{
 const r=reportFor("Keenan Gray","https://www.imdb.com/name/nm16096261/");
 r.intelligence={discrepancies:[{
  platform:"imdb",recordUrl:"https://www.imdb.com/name/nm16096261/",
  currentStatement:"Biography says Seedless is most recent short.",
  conflictingStatement:"Toy Gun is a listed later short.",
  proposedAction:"Confirm release history and propose factual update.",
  evidence:[{url:"https://www.imdb.com/name/nm16096261/",excerpt:"His latest film is Seedless."}]
 }]};
 const g=get("keenan-gray","Keenan Gray",r.subject.link,r);
 assert.equal(g.overview.correctionCandidates,1);
 assert.equal(g.overview.submittedCorrections,0);
 assert.equal(g.overview.verifiedCorrections,0);
 assert.equal(g.repairs[0].adapterAvailable,false);
 assert.equal(g.repairs[0].state,"research_candidate_requires_review");
 assert.ok(g.claims.some(x=>x.predicate==="disputed_biography_statement"&&x.state==="observed_not_truth_verified"));
});
test("maintenance records a baseline and flags new source evidence, not false removals",()=>{
 const oldReport=reportFor("Sam Ferlo");
 oldReport.evidence=[{url:"https://www.imdb.com/name/nm11793230/",label:"IMDb"}];
 const old=get("sam-ferlo","Sam Ferlo",null,oldReport);
 const baseline=compareIdentityGraphs(null,old);
 assert.equal(baseline.baseline,true);
 assert.equal(baseline.reviewCount,0);
 const newReport=reportFor("Sam Ferlo");
 newReport.generatedAt="2026-11-08T18:00:00Z";
 newReport.evidence=[{url:"https://www.imdb.com/name/nm11793230/",label:"IMDb"},{url:"https://stage.example.org/sam-ferlo",label:"Stage profile"}];
 const current=get("sam-ferlo","Sam Ferlo",null,newReport);
 const diff=compareIdentityGraphs(old,current);
 assert.equal(diff.baseline,false);
 assert.ok(diff.changes.some(x=>x.kind==="new_search_source"&&x.url.includes("stage.example.org")));
 assert.ok(!diff.changes.some(x=>x.kind==="not_in_latest_scan"));
 assert.throws(()=>compareIdentityGraphs(get("davis-brown","Davis Brown",null),current));
});
test("partial results do not claim disappeared links were deleted",()=>{
 const r=reportFor("Liam Gundlach");r.evidence=[{url:"https://www.smirkus.org/liam-gundlach/"}];
 const old=get("liam-gundlach","Liam Gundlach",null,r);
 const now=reportFor("Liam Gundlach");now.webResearch.status="partial";now.generatedAt="2026-11-08T18:00:00Z";
 const g=get("liam-gundlach","Liam Gundlach",null,now);
 const diff=compareIdentityGraphs(old,g);
 assert.ok(diff.changes.some(c=>c.kind==="not_in_latest_scan"&&/does not establish deletion/i.test(c.message)));
 assert.match(diff.coverageWarning,/partial/i);
});
test("claim text change is flagged for review instead of treated as a verified correction",()=>{
 const make=(heading,date)=>{
  const r=reportFor("Keenan Gray","https://www.thiskeenan.com/");
  r.generatedAt=date;r.site={url:"https://www.thiskeenan.com/",parsed:{
   title:"Keenan Gray - Film Director",heading,people:[{name:"Keenan Gray"}],sameAs:[]}};
  return get("keenan-gray","Keenan Gray",r.subject.link,r);
 };
 const old=make("Film director","2026-11-07T18:00:00Z");
 const current=make("Brooklyn filmmaker","2026-11-08T18:00:00Z");
 const diff=compareIdentityGraphs(old,current);
 assert.ok(diff.changes.some(c=>c.kind==="observed_claim_text_changed"&&c.before==="Film director"&&c.after==="Brooklyn filmmaker"));
 assert.equal(current.overview.verifiedCorrections,0);
});
test("rejects cross-person data or missing name without inventing identity",()=>{
 assert.throws(()=>get("sam-ferlo","Sam Ferlo",null,reportFor("Davis Brown")));
 assert.throws(()=>get("liam-gundlach","",null,reportFor("Liam Gundlach")));
 assert.throws(()=>get("Not-a-key","Sam Ferlo",null,reportFor("Sam Ferlo")));
});

test("search observations work across professions but cannot assert a person's facts",()=>{
 const r=reportFor("Davis Brown");
 r.candidates.web=[{
  url:"https://www.eliteprospects.com/player/116975/davis-brown",
  title:"Davis Brown ice hockey",
  description:"Davis Brown is a hockey player with several recent appearances."
 }];
 const g=get("davis-brown","Davis Brown",null,r);
 assert.equal(g.observations.length,1);
 assert.equal(g.observations[0].identityConfirmed,false);
 assert.equal(g.observations[0].factVerified,false);
 assert.equal(g.claims.length,0);
 assert.equal(g.repairs.length,0);
 const r2=structuredClone(r);r2.generatedAt="2026-11-08T18:00:00Z";
 r2.candidates.web[0].description="Davis Brown hockey profile updated 2026.";
 const next=get("davis-brown","Davis Brown",null,r2);
 const changes=compareIdentityGraphs(g,next);
 assert.ok(changes.changes.some(x=>x.kind==="indexed_excerpt_changed"&&x.status==="recheck_needed"));
 assert.equal(changes.changes.some(x=>x.kind==="observed_claim_text_changed"),false);
});
