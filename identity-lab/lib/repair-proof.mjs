// Read-only checks of public identity records. Never infer who caused a change.
import {safePublicUrl} from "./identity-discovery.mjs";

const clean=(x,max=300)=>String(x??"").trim().replace(/\s+/g," ").slice(0,max);
const websiteFields=new Set(["title","heading","person_name","same_as"]);
const wikidataFields=Object.freeze({official_website:"P856",imdb_id:"P345",tmdb_person_id:"P4985"});
const fail=(message)=>{throw new Error(message);};

export function normalizePublicUrl(raw){
 const url=new URL(safePublicUrl(raw));
 url.search="";url.hash="";
 return url.protocol+"//"+url.hostname.replace(/^www\./,"")+url.pathname.replace(/\/$/,"").toLowerCase();
}
function equality(actual,expected,isUrl=false){
 if(isUrl){try{return normalizePublicUrl(actual)===normalizePublicUrl(expected);}catch{return false;}}
 return clean(actual).toLocaleLowerCase("en")===clean(expected).toLocaleLowerCase("en");
}
export function parseProofRequest(body){
 if(!body||typeof body!=="object"||Array.isArray(body))fail("Provide a verification request.");
 const platform=clean(body.platform,20),field=clean(body.field,40),expected=clean(body.expected,240);
 if(expected.length<2)fail("Provide the exact value you want to verify.");
 if(platform==="website"){
  if(!websiteFields.has(field))fail("Unsupported website field.");
  const url=safePublicUrl(body.url);
  if(field==="same_as")safePublicUrl(expected);
  return {platform,field,url,expected};
 }
 if(platform==="wikidata"){
  if(!Object.hasOwn(wikidataFields,field))fail("Unsupported knowledge-record field.");
  const url=safePublicUrl(body.url);
  const match=url.match(/^https:\/\/(?:www\.)?wikidata\.org\/wiki\/(Q[1-9][0-9]*)\/?$/i);
  if(!match)fail("Use an existing Wikidata Q-item URL.");
  if(field==="official_website")safePublicUrl(expected);
  if(field==="imdb_id"&&!/^nm[0-9]{3,12}$/.test(expected))fail("Enter the IMDb person ID (nm...).");
  if(field==="tmdb_person_id"&&!/^[1-9][0-9]{0,12}$/.test(expected))fail("Enter the numeric TMDb person ID.");
  return {platform,field,url:"https://www.wikidata.org/wiki/"+match[1].toUpperCase(),id:match[1].toUpperCase(),expected};
 }
 fail("Direct public verification is currently limited to websites and Wikidata.");
}
function result({platform,field,url,expected,observed,matched}){
 return {platform,field,url,expected,observed,status:matched?"verified_public":"not_visible",
  checkedAt:new Date().toISOString(),method:"direct_public_read",
  note:"This checks public visibility only. It does not establish who changed a record, whether Google indexed it, or whether a Knowledge Panel will appear."};
}
export function verifyWebsite(parsed,input){
 if(!parsed||typeof parsed!=="object")fail("No parsed website data available.");
 if(input.platform!=="website")fail("Wrong verification platform.");
 const values=input.field==="title"?[parsed.title]:
  input.field==="heading"?[parsed.heading]:
  input.field==="person_name"?(Array.isArray(parsed.people)?parsed.people.map(p=>p?.name):[]):
  input.field==="same_as"?(Array.isArray(parsed.sameAs)?parsed.sameAs:[]):[];
 const observed=values.map(value=>clean(value)).filter(Boolean).slice(0,30);
 const matched=observed.some(value=>equality(value,input.expected,input.field==="same_as"));
 return result({...input,observed,matched});
}
export function verifyWikidata(entity,input){
 if(input.platform!=="wikidata")fail("Wrong verification platform.");
 if(!entity||typeof entity!=="object"||entity.missing!==undefined)fail("Wikidata item could not be read.");
 const observed=(Array.isArray(entity.claims?.[wikidataFields[input.field]])?entity.claims[wikidataFields[input.field]]:[])
  .map(claim=>claim?.mainsnak?.datavalue?.value).filter(value=>typeof value==="string"||typeof value==="number")
  .map(value=>clean(value)).filter(Boolean).slice(0,30);
 const matched=observed.some(value=>equality(value,input.expected,input.field==="official_website"));
 return result({...input,observed,matched});
}
