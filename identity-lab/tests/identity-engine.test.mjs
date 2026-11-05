import test from "node:test";
import assert from "node:assert/strict";
import {RULES,validateProfile,evidenceList,makeTask,makePacket,transition,nextAction} from "../public/identity-engine.mjs";
const base={
 subject:"Keenan Gray",
 platform:"imdb",
 profileUrl:"https://www.imdb.com/name/nm16096261/",
 current:"Biography omits newer film credits.",
 desired:"The biography should include Toy Gun (2026).",
 evidence:[{url:"https://www.imdb.com/name/nm16096261/",kind:"industry",label:"IMDb"},
 {url:"https://www.leagueoffilmmakers.com/toy-gun-throws-a-birthday-party-at-the-end-of-the-world/",kind:"independent",label:"League of Filmmakers"}]
};
test("all expected provider rules exist",()=>assert.deepEqual(Object.keys(RULES).sort(),["imdb","linkedin","tmdb","website","wikidata","wikipedia"]));
test("parse each legitimate platform profile",()=>{
 const cases=[["imdb","https://www.imdb.com/name/nm16096261/"],["tmdb","https://www.themoviedb.org/person/5386453-keenan-gray"],
 ["wikipedia","https://en.wikipedia.org/wiki/Ada_Lovelace"],["wikidata","https://www.wikidata.org/wiki/Q7259"],
 ["linkedin","https://www.linkedin.com/in/keenantest/"],["website","https://www.thiskeenan.com/about"]];
 for(const [platform,url] of cases)assert.equal(validateProfile(platform,url).platform,platform);
 assert.match(validateProfile("wikipedia","https://en.wikipedia.org/wiki/Ada_Lovelace").talkUrl,/Talk:/);
});
test("reject wrong profile domains and namespaces",()=>{
 assert.throws(()=>validateProfile("imdb","https://evil.test/name/nm16096261/"));
 assert.throws(()=>validateProfile("linkedin","https://www.linkedin.com/company/other-company"));
 assert.throws(()=>validateProfile("wikipedia","https://en.wikipedia.org/wiki/User:Example"));
 assert.throws(()=>validateProfile("wikidata","https://www.wikidata.org/wiki/Property:P31"));
 assert.throws(()=>validateProfile("website","http://example.com"));
});
test("supported contributor correction is draft and packet contains real newlines",()=>{
 const x=makeTask(base);
 assert.equal(x.status,"draft");
 assert.equal(x.channel,"contributor");
 assert.match(nextAction(x),/Review the proposed/);
 const packet=makePacket(x);
 assert.ok(packet.includes("\n\n"));
 assert.match(packet,/Toy Gun/);
 assert.match(packet,/DRAFT ONLY/);
});
test("empty evidence blocks downstream workflow",()=>{
 const x=makeTask({...base,evidence:[]});
 assert.equal(x.status,"needs_evidence");
 assert.throws(()=>transition(x,"ready_for_review",{reviewed:true}));
});
test("Wikipedia correction stays a disclosed request with independent reference",()=>{
 const x=makeTask({...base,platform:"wikipedia",profileUrl:"https://en.wikipedia.org/wiki/Ada_Lovelace",evidence:[{url:"https://www.britannica.com/biography/Ada-Lovelace",kind:"independent"}]});
 assert.equal(x.channel,"editorial_request");
 assert.equal(x.status,"draft");
 const packet=makePacket(x,{clientName:"Ada Lovelace"});
 assert.match(packet,/conflict of interest/i);
 assert.match(packet,/talk page/i);
 const unverified=makeTask({...base,platform:"wikipedia",profileUrl:"https://en.wikipedia.org/wiki/Ada_Lovelace",evidence:[{url:"https://example.com",kind:"first_party"}]});
 assert.equal(unverified.status,"needs_evidence");
});
test("Wikidata creates source-backed existing Q item request",()=>{
 const x=makeTask({...base,platform:"wikidata",profileUrl:"https://www.wikidata.org/wiki/Q7259"});
 assert.equal(x.status,"draft");assert.equal(x.profile.id,"Q7259");assert.match(makePacket(x),/paid contributions/);
});
test("LinkedIn always routes to the customer",()=>{
 const x=makeTask({...base,platform:"linkedin",profileUrl:"https://www.linkedin.com/in/keenantest/"});
 assert.equal(x.status,"customer_action");
 assert.equal(x.channel,"owner");
 assert.match(makePacket(x),/Do not share your password/);
 assert.throws(()=>transition(x,"ready_for_review",{reviewed:true}));
});
test("evidence and real submission receipt are required",()=>{
 const x=makeTask(base);
 assert.throws(()=>transition(x,"ready_for_review"));
 const reviewed=transition(x,"ready_for_review",{reviewed:true});
 assert.throws(()=>transition(reviewed,"submitted",{reviewed:true,approved:true}));
 const submitted=transition(reviewed,"submitted",{reviewed:true,approved:true,receipt:"IMDb #5289100"});
 assert.equal(submitted.status,"submitted");
 assert.throws(()=>transition(submitted,"accepted",{approved:true,verifiedUrl:"https://evil.example/profile"}));
 assert.equal(transition(submitted,"accepted",{approved:true,verifiedUrl:x.profile.url}).status,"accepted");
});
test("owner completed edit needs an approved same-platform verification URL",()=>{
 const x=makeTask({...base,platform:"website",profileUrl:"https://www.thiskeenan.com/about"});
 assert.equal(x.status,"customer_action");
 assert.throws(()=>transition(x,"accepted",{approved:false,verifiedUrl:x.profile.url}));
 assert.equal(transition(x,"accepted",{approved:true,verifiedUrl:x.profile.url}).status,"accepted");
});
