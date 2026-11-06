import test from "node:test";
import assert from "node:assert/strict";
import {makeTask,transition} from "../public/identity-engine.mjs";
import {CASE_SCHEMA_VERSION,withHistory,recordSubmission,recordPublicObservation,recordReversion,recordHumanWork,summarizeTask,summarizeCases,exportCaseFile} from "../public/case-engine.mjs";
const sources=[{url:"https://www.leagueoffilmmakers.com/toy-gun-throws-a-birthday-party-at-the-end-of-the-world/",kind:"independent",label:"Film feature"}];
function task(platform="imdb"){
 return makeTask({subject:"Keenan Gray",platform,profileUrl:platform==="tmdb"?"https://www.themoviedb.org/person/5386453-keenan-gray":"https://www.imdb.com/name/nm16096261/",current:"The biography omitted a 2026 directing credit.",desired:"Include the documented Toy Gun (2026) directing credit.",evidence:sources});
}
test("new tasks have an audit history but not external action",()=>{
 const t=withHistory(task()); const summary=summarizeTask(t);
 assert.equal(summary.submissionState,"no_receipt");
 assert.equal(summary.publicState,"unchecked");
 assert.equal(summary.editorialState,"not_established");
 assert.equal(t.activity.length,2);
});
test("only a reviewed, approved contribution with a real receipt is logged as submitted",()=>{
 const t=task(),ready=transition(t,"ready_for_review",{reviewed:true});
 assert.throws(()=>recordSubmission(t,"123456"));
 assert.throws(()=>transition(ready,"submitted",{reviewed:true,approved:true}),/real submission/i);
 const actual=transition(ready,"submitted",{reviewed:true,approved:true,receipt:"261105-215119-060000"});
 const logged=recordSubmission(actual,"261105-215119-060000",{source:"user_provided_receipt",at:"2026-11-05"});
 const summary=summarizeTask(logged);
 assert.equal(summary.submissionState,"receipt_recorded");
 assert.equal(summary.editorialState,"not_established");
 assert.equal(summary.publicState,"unchecked");
 assert.equal(recordSubmission(logged,"261105-215119-060000").activity.length,logged.activity.length);
});
test("TMDb can show a public biography without an Identity Lab submission",()=>{
 const t=recordPublicObservation(task("tmdb"),{
  url:"https://www.themoviedb.org/person/5386453-keenan-gray",
  statement:"A biography was reported visible on the TMDb profile.",
  source:"prior_report",observedAt:"2026-11-05"
 });
 const summary=summarizeTask(t);
 assert.equal(summary.publicState,"historically_reported");
 assert.equal(summary.submissionState,"no_receipt");
 assert.equal(summary.editorialState,"not_established");
});
test("public observations require a specific text claim and an exact record",()=>{
 const t=task();
 assert.throws(()=>recordPublicObservation(t,{url:"https://www.imdb.com/name/nm999999/",statement:"Toy Gun (2026) in biography"}),/same person/i);
 assert.throws(()=>recordPublicObservation(t,{url:"https://www.imdb.com/name/nm16096261/bio/",statement:"yes"}),/exact/i);
 assert.throws(()=>recordPublicObservation(t,{url:"https://evil.example/name/nm16096261/",statement:"Toy Gun (2026) in biography"}),/same platform/i);
 const updated=recordPublicObservation(t,{url:"https://www.imdb.com/name/nm16096261/bio/",statement:"Toy Gun (2026) is visible in the biography."});
 assert.equal(summarizeTask(updated).publicState,"operator_observed");
 assert.equal(summarizeTask(updated).submissionState,"no_receipt");
});
test("a reversal is distinct from rejection and requires prior observation",()=>{
 const t=task();
 assert.throws(()=>recordReversion(t,{url:t.profile.url,statement:"Biography no longer includes Toy Gun"}),/earlier/i);
 const observed=recordPublicObservation(t,{url:t.profile.url,statement:"Toy Gun (2026) appears as a directing credit"});
 const reversed=recordReversion(observed,{url:t.profile.url,statement:"Toy Gun (2026) has disappeared again"});
 assert.equal(summarizeTask(reversed).publicState,"reverted");
 assert.equal(summarizeTask(reversed).editorialState,"not_established");
});
test("records real human-time logs and aggregates by person",()=>{
 const imdb=recordHumanWork(task(),{minutes:8,note:"Reviewed supporting evidence"});
 const tmdb=recordHumanWork(task("tmdb"),{minutes:3,note:"Checked public biography"});
 const combined=summarizeCases([imdb,tmdb]);
 assert.equal(combined.length,1);
 assert.equal(combined[0].humanMinutes,11);
 assert.equal(combined[0].receiptCount,0);
 assert.equal(combined[0].publicObservationCount,0);
 assert.equal(exportCaseFile([imdb,tmdb]).schemaVersion,CASE_SCHEMA_VERSION);
 assert.throws(()=>recordHumanWork(imdb,{minutes:0,note:"test"}));
 assert.throws(()=>recordHumanWork(imdb,{minutes:4.5,note:"test"}));
});
test("legacy acceptance is unverified, not automatically a confirmed public fact",()=>{
 const legacy={...task(),status:"accepted",verifiedUrl:"https://www.imdb.com/name/nm16096261/",activity:undefined};
 const summary=summarizeTask(legacy);
 assert.equal(summary.publicState,"legacy_unverified");
 assert.equal(summary.submissionState,"no_receipt");
 assert.equal(summarizeCases([legacy])[0].publicObservationCount,0);
});
