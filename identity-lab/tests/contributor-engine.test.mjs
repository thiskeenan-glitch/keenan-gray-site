import test from "node:test";
import assert from "node:assert/strict";
import {parseProfile,makeCase,buildPacket,updateTask,validateBiography} from "../public/contributor-engine.mjs";

const subject={
 name:"Keenan Gray", imdbUrl:"https://www.imdb.com/name/nm16096261/",
 tmdbUrl:"https://www.themoviedb.org/person/5386453-keenan-gray",
 biography:"Keenan Gray is a Brooklyn-based film director editor and producer. His films include Toy Gun in 2026 and Seedless in 2025. He previously worked in production at Saturday Night Live. He has worked on independent cinema projects and film festivals. This biography is an evidence-backed professional summary intended for a contributor review rather than a paid publicity page.",
 evidence:["https://www.imdb.com/name/nm16096261/","https://www.themoviedb.org/person/5386453-keenan-gray"]
};
test("valid and invalid identity URLs",()=>{
 assert.equal(parseProfile("imdb",subject.imdbUrl).id,"nm16096261");
 assert.equal(parseProfile("tmdb",subject.tmdbUrl).id,"5386453");
 assert.throws(()=>parseProfile("imdb","https://evil.example/name/nm16096261/"));
 assert.throws(()=>parseProfile("tmdb","https://www.themoviedb.org/movie/54321"));
});
test("build reusable task set",()=>{
 const result=makeCase(subject);
 assert.equal(result.tasks.length,4);
 assert.equal(result.evidence.length,2);
 assert.equal(result.tasks[0].platform,"imdb");
 assert.match(buildPacket(result.tasks[0]),/IMDb/);
 assert.match(buildPacket(result.tasks[0]),/nm16096261/);
});
test("different people and profiles",()=>{
 const c=makeCase({...subject,name:"Jane Filmmaker",imdbUrl:"https://www.imdb.com/name/nm10000/",tmdbUrl:""});
 assert.equal(c.tasks.length,2);
 assert.equal(c.tasks[0].profile.id,"nm10000");
});
test("biography word count and requirements",()=>{
 assert.ok(validateBiography(subject.biography).wordCount>=50);
 assert.equal(validateBiography("Too short").valid,false);
});
test("locked claimed biographies block ordinary contributor path",()=>{
 const c=makeCase({...subject,imdbClaimedLocked:true});
 const t=c.tasks.find(x=>x.id==="imdb-bio");
 assert.equal(t.status,"needs_owner");
 assert.throws(()=>updateTask(t,"ready_for_review"));
});
test("receipt required to say submitted",()=>{
 const c=makeCase(subject);
 const task=c.tasks[0];
 const ready=updateTask(task,"ready_for_review");
 assert.throws(()=>updateTask(ready,"submitted",{receipt:"abc123"}));
 const approved={...ready,approvedForSubmission:true};
 assert.throws(()=>updateTask(approved,"submitted",{receipt:""}));
 const submitted=updateTask(approved,"submitted",{receipt:"IMDb#123456"});
 assert.equal(submitted.status,"submitted");
 assert.throws(()=>updateTask(submitted,"accepted",{}));
 const accepted=updateTask(submitted,"accepted",{publicVerification:"https://www.imdb.com/name/nm16096261/"});
 assert.equal(accepted.status,"accepted");
});
