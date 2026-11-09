import assert from "node:assert/strict";
import test from "node:test";
import {parseProofRequest,verifyWebsite,verifyWikidata} from "./lib/repair-proof.mjs";

test("heading verification checks exact field, not name appearing elsewhere",()=>{
 const input=parseProofRequest({platform:"website",url:"https://www.thiskeenan.com/about",field:"heading",expected:"Keenan Gray"});
 assert.equal(verifyWebsite({title:"Keenan Gray | Director",heading:"Me",people:[{name:"Keenan Gray"}]},input).status,"not_visible");
 assert.equal(verifyWebsite({title:"Keenan Gray | Director",heading:"Keenan Gray",people:[{name:"Keenan Gray"}]},input).status,"verified_public");
});
test("sameAs verification compares the correct public profile URL",()=>{
 const input=parseProofRequest({platform:"website",url:"https://www.thiskeenan.com/",field:"same_as",expected:"https://www.imdb.com/name/nm16096261/"});
 assert.equal(verifyWebsite({sameAs:["https://www.imdb.com/name/nm16096261/"]},input).status,"verified_public");
 assert.equal(verifyWebsite({sameAs:["https://www.imdb.com/name/nm16096262/"]},input).status,"not_visible");
});
test("Wikidata verification inspects named statement, not just item existence",()=>{
 const input=parseProofRequest({platform:"wikidata",url:"https://www.wikidata.org/wiki/Q12345",field:"official_website",expected:"https://www.thiskeenan.com/"});
 const entity={claims:{P856:[{mainsnak:{datavalue:{value:"https://thiskeenan.com"}}}]}};
 assert.equal(verifyWikidata(entity,input).status,"verified_public");
 assert.equal(verifyWikidata({claims:{P856:[]}},input).status,"not_visible");
});
test("invalid targets and unsupported platform requests are refused",()=>{
 for(const body of [
  {platform:"website",url:"https://localhost",field:"heading",expected:"Keenan Gray"},
  {platform:"website",url:"https://127.0.0.1/",field:"heading",expected:"Keenan Gray"},
  {platform:"wikidata",url:"https://notwikidata.org/wiki/Q123",field:"official_website",expected:"https://thiskeenan.com"},
  {platform:"imdb",url:"https://www.imdb.com/name/nm16096261/",field:"bio",expected:"Keenan Gray"},
  {platform:"website",url:"https://www.thiskeenan.com/",field:"same_as",expected:"Keenan Gray"}
 ])assert.throws(()=>parseProofRequest(body));
});
