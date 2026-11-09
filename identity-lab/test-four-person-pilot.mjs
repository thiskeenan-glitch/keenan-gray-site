import assert from "node:assert/strict";
import test from "node:test";
import {PILOT_COHORT,getPilotPerson,normalizePilotLink,
 makePilotCase,canDispatchPilotRepair} from "./public/pilot-engine.mjs";

test("pilot includes precisely the four approved subjects, excluding Andy",()=>{
 assert.deepEqual(PILOT_COHORT.map(x=>x.name),["Keenan Gray","Sam Ferlo","Liam Gundlach","Davis Brown"]);
 assert.equal(PILOT_COHORT.length,4);
 assert.equal(PILOT_COHORT.some(x=>/andy/i.test(x.name)),false);
 assert.throws(()=>getPilotPerson("andy-kugler"));
});
test("name-only findings and speculative Knowledge Panel claims create zero executable corrections",()=>{
 const report={
  generatedAt:"2026-11-06T18:00:00Z",
  subject:{name:"Sam Ferlo",link:null},
  summary:{manual:3},
  coverage:{webSearch:"ok"},
  evidence:[{url:"https://www.imdb.com/name/nm1234567/",label:"Unverified namesake lead"}],
  results:[
   {id:"panel",status:"manual",title:"Knowledge Panel status",recommendation:"Search Google manually"},
   {id:"web",status:"manual",title:"Public mentions",recommendation:"Review web references"},
   {id:"wikidata",status:"manual",title:"Possible identity match",recommendation:"Confirm Q-item"}
  ]
 };
 const testCase=makePilotCase({personId:"sam-ferlo",report});
 assert.equal(testCase.counts.sourceLeads,1);
 assert.equal(testCase.counts.potentialGaps,0);
 assert.equal(testCase.counts.verifiedPublicChanges,0);
 assert.equal(testCase.permission.participantAuthorizedEdits,false);
 assert.equal(testCase.actorTrail[0].actor,"ulab_system");
 assert.equal(testCase.actorTrail[2].status,"blocked_pending_explicit_permission");
});
test("a directly observed owner-site gap remains a candidate, never an approved repair",()=>{
 const report={
  generatedAt:"2026-11-06T18:01:00Z",
  subject:{name:"Keenan Gray",link:"https://www.thiskeenan.com"},
  site:{url:"https://www.thiskeenan.com",parsed:{title:"Keenan Gray",people:[],sameAs:[]}},
  webResearch:{status:"partial"},
  evidence:[{url:"https://www.thiskeenan.com"}],
  results:[{id:"site_linked_profiles",status:"action",title:"No sameAs links found",
   detail:"The scanned homepage did not publish sameAs values.",url:"https://www.thiskeenan.com",
   recommendation:"If you own this website, publish accurate Person.sameAs links."}]
 };
 const testCase=makePilotCase({personId:"keenan-gray",report});
 assert.equal(testCase.counts.potentialGaps,1);
 assert.equal(testCase.opportunities[0].classification,"potential_gap_not_verified_error");
 assert.equal(testCase.opportunities[0].route,"owner_website");
 assert.equal(testCase.opportunities[0].approvalRecorded,false);
 assert.equal(canDispatchPilotRepair(testCase.opportunities[0],{
  scopedCredentialPresent:true,adapterSupportsExactChange:true,requestedScope:"owner_approved_patch_only"
 }),false);
});
test("source from a namesake or unrelated website is not presented as a repair opportunity",()=>{
 const report={subject:{name:"Davis Brown",link:null},results:[
  {id:"site_name",status:"action",title:"Unknown person's page",url:"https://stranger.example.com",
   recommendation:"Fix another person's schema"},
  {id:"site_links",status:"manual",title:"Check site",url:"https://example.com",
   recommendation:"Confirm references"}
 ]};
 const testCase=makePilotCase({personId:"davis-brown",report});
 assert.equal(testCase.counts.potentialGaps,0);
 assert.equal(testCase.permission.siteOwnershipVerified,false);
 assert.equal(testCase.permission.thirdPartyEditPermission,false);
});
test("a fully verified and explicitly authorized owner-website repair is dispatchable in principle",()=>{
 const task={route:"owner_website",classification:"verified_factual_error",
  sourceOwnershipVerified:true,subjectConsentRecorded:true,humanReviewCompleted:true,approvalRecorded:true};
 const authorization={scopedCredentialPresent:true,adapterSupportsExactChange:true,
  requestedScope:"owner_approved_patch_only"};
 assert.equal(canDispatchPilotRepair(task,authorization),true);
 assert.equal(canDispatchPilotRepair({...task,route:"editorial_review"},authorization),false);
 assert.equal(canDispatchPilotRepair({...task,subjectConsentRecorded:false},authorization),false);
 assert.equal(canDispatchPilotRepair(task,{...authorization,scopedCredentialPresent:false}),false);
});
test("invalid intake links are rejected rather than silently treated as ownership",()=>{
 assert.equal(normalizePilotLink("www.thiskeenan.com").startsWith("https://"),true);
 assert.equal(normalizePilotLink("http://169.254.169.254"),"");
 assert.equal(normalizePilotLink("javascript:alert(1)"),"");
 assert.throws(()=>makePilotCase({personId:"sam-ferlo",report:{subject:{name:"Keenan Gray"}}}));
});
