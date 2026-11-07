import assert from "node:assert/strict";
import test from "node:test";
import {
 identityMatches,findAnchoredImdb,imdbResearchQueries,
 detectImdbBiographyDiscrepancy,analyzeIdentity
} from "./lib/identity-intelligence.mjs";
import {makePilotCase} from "./public/pilot-engine.mjs";

const person={
 name:"Keenan Gray",link:"https://www.thiskeenan.com/",
 anchor:{kind:"website"}
};
const site={ok:true,url:"https://www.thiskeenan.com/",parsed:{
 title:"Keenan Gray | Film Director",heading:"Keenan Gray",
 people:[{name:"Keenan Gray",description:"Film director based in Brooklyn"}],
 sameAs:["https://www.imdb.com/name/nm16096261/","https://www.instagram.com/thiskeenan/"],
 outlinks:[]
}};
const imdbUrl="https://www.imdb.com/name/nm16096261/";
const imdbEvidence=[
 {url:imdbUrl,title:"Keenan Gray - IMDb",description:
  "Keenan is a film director. His most recent short film, Seedless, was shot by the SNL cinematographer."},
 {url:imdbUrl,title:"Keenan Gray - IMDb",description:
  "Director: Toy Gun (2026) Short director. Seedless (2025) Short Director. Diabolo Tamer (2024) Short Director."}
];
test("IMDb profile requires an exact profile ID supplied or cross-linked from an inspected website",()=>{
 assert.equal(findAnchoredImdb({link:person.link,site}).id,"nm16096261");
 assert.equal(findAnchoredImdb({link:imdbUrl,site:null}).id,"nm16096261");
 assert.equal(findAnchoredImdb({link:"",site:null}),null);
 assert.equal(findAnchoredImdb({link:person.link,site:{...site,ok:false}}),null);
 assert.equal(findAnchoredImdb({link:person.link,site:{...site,parsed:{...site.parsed,sameAs:[imdbUrl,"https://www.imdb.com/name/nm999999/"]}}}),null);
});
test("search clustering separates explicitly linked profiles from name-only namesakes",()=>{
 const web=[
  {url:imdbUrl,title:"Keenan Gray - IMDb",description:"Director Toy Gun"},
  {url:"https://www.instagram.com/thiskeenan/",title:"Keenan Gray IG",description:"Filmmaker"},
  {url:"https://example.org/athletes/keenan-gray",title:"Keenan Gray, basketball player",description:"2026 college roster"},
  {url:"https://example.org/film/keenan-gray",title:"Keenan Gray, filmmaker",description:"Brooklyn film director of short films"}
 ];
 const result=identityMatches({name:person.name,link:person.link,site,web});
 assert.equal(result.linked.length,2);
 assert.equal(result.ambiguous.some(x=>x.url.includes("/athletes/")),true);
 assert.equal(result.linked.some(x=>x.url.includes("/athletes/")),false);
 assert.equal(result.contextual.some(x=>x.url.includes("/film/")),true);
 assert.equal(result.contextual.some(x=>x.requiresConfirmation===false),false);
});
test("targeted IMDb research is anchored to the exact person page, not namesakes",()=>{
 const qs=imdbResearchQueries("Keenan Gray","nm16096261");
 assert.equal(qs.length,2);
 assert.ok(qs.every(x=>x.includes("nm16096261")));
 assert.deepEqual(imdbResearchQueries("Keenan Gray","invalid"),[]);
});
test("system produces an evidence-backed IMDb biography chronology review case",()=>{
 const reports=detectImdbBiographyDiscrepancy({
  name:person.name,profile:{id:"nm16096261",url:imdbUrl},
  results:imdbEvidence,checkedAt:"2026-11-07T00:00:00Z"
 });
 assert.equal(reports.length,1);
 assert.match(reports[0].currentStatement,/Seedless/);
 assert.match(reports[0].conflictingStatement,/Toy Gun \(2026\)/);
 assert.equal(reports[0].actor,"ulab_system");
 assert.equal(reports[0].execution.available,false);
 assert.equal(reports[0].verification.status,"not_started");
 assert.equal(reports[0].evidence.length,2);
 const report={subject:{name:person.name,link:person.link},site,results:[],
  webResearch:{status:"ok"},intelligence:analyzeIdentity({input:person,site,web:[],imdbSearch:imdbEvidence})};
 const pilot=makePilotCase({personId:"keenan-gray",report});
 assert.equal(pilot.counts.thirdPartyCandidates,1);
 assert.equal(pilot.counts.submittedEdits,0);
 assert.equal(pilot.thirdPartyCandidates[0].actor,"ulab_system");
});
test("no false discrepancy without anchored ID, credible chronology or same-profile sources",()=>{
 const goodProfile={id:"nm16096261",url:imdbUrl};
 assert.equal(detectImdbBiographyDiscrepancy({name:"Keenan Gray",profile:goodProfile,results:[
  {url:"https://www.imdb.com/name/nm999999/",title:"Keenan Gray IMDb",description:"His most recent short film, Seedless, was directed."},
  imdbEvidence[1]
 ]}).length,0);
 assert.equal(detectImdbBiographyDiscrepancy({name:"Keenan Gray",profile:goodProfile,results:[
  imdbEvidence[0],
  {url:imdbUrl,title:"Keenan Gray",description:"Toy Gun (2026) Actor; Seedless (2025) Short Director."}
 ]}).length,0);
 assert.equal(detectImdbBiographyDiscrepancy({name:"Keenan Gray",profile:goodProfile,results:[
  imdbEvidence[0],{url:imdbUrl,title:"Keenan Gray",description:"Toy Gun (2026) Short Director."}
 ]}).length,0);
 assert.equal(detectImdbBiographyDiscrepancy({name:"Keenan Gray",profile:goodProfile,results:[
  {url:imdbUrl,title:"Keenan Gray IMDb",description:"Director of Seedless; latest short not disclosed."},imdbEvidence[1]
 ]}).length,0);
});
test("name-only audit cannot generate an anchored IMDb correction",()=>{
 const report=analyzeIdentity({input:{name:"Keenan Gray",link:null},site:null,web:imdbEvidence,imdbSearch:imdbEvidence});
 assert.equal(report.investigatedProfile,null);
 assert.equal(report.discrepancies.length,0);
});
