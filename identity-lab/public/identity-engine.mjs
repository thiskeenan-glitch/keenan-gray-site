// Identity Lab: cross-platform correction planning engine.
// Read-only. No authentication, account writes, or network requests.
export const RULES = Object.freeze({
  imdb: {label:"IMDb",channel:"contributor",needsAccount:true,method:"Registered contributor suggestion",policy:"Registered contributors may propose eligible updates. Claimed/locked records may require the owner.",help:"https://help.imdb.com/article/contribution/contribution-information/how-do-i-contribute-data-to-imdb/G3G5Z4MZJUR6D9Q8"},
  tmdb: {label:"TMDb",channel:"contributor",needsAccount:true,method:"TMDb website contributor editor",policy:"Use authorized website editing; verify exact credits and avoid duplicates. No general person-record write API is assumed.",help:"https://www.themoviedb.org/bible"},
  wikipedia: {label:"Wikipedia",channel:"editorial_request",needsAccount:true,method:"Disclosed conflict-of-interest edit request",policy:"Existing article only. A paid/connected contributor must disclose affiliation. Draft a neutral talk-page request with independent sources, never a promotional edit.",help:"https://en.wikipedia.org/wiki/Wikipedia:Edit_requests"},
  wikidata: {label:"Wikidata",channel:"editorial_request",needsAccount:true,method:"Disclosed, sourced existing-item correction",policy:"Existing eligible Q-item only. Verify identifiers and cite sources. Paid contributions require disclosure and Wikidata rules apply.",help:"https://www.wikidata.org/wiki/Wikidata:Disclosure_of_paid_editing"},
  linkedin: {label:"LinkedIn",channel:"owner",needsAccount:false,method:"Account-owner profile edit",policy:"Only the profile owner can update their information through supported LinkedIn tools. No scraping or third-party profile write is attempted.",help:"https://www.linkedin.com/help/linkedin"},
  website: {label:"Personal/company website",channel:"owner",needsAccount:false,method:"Owner-approved website edit",policy:"Change only through owner authorization and a verified integration or owner-side workflow.",help:"https://developers.google.com/search/docs/appearance/structured-data/profile-page"}
});
export const CHANNELS = Object.freeze({contributor:"Our contributor workflow",editorial_request:"Disclosed edit request",owner:"Customer action"});
const fail=(message)=>{throw new Error(message);};
const txt=(value,limit=1500)=>String(value??"").trim().slice(0,limit);
const hostname=(host,domain)=>host===domain||host==="www."+domain;
function urlOf(raw){
 let url;
 try{url=new URL(txt(raw,1000));}catch{fail("Enter a valid HTTPS URL.");}
 if(url.protocol!=="https:"||url.username||url.password||url.port)fail("Use a public HTTPS URL with no credentials.");
 if(!url.hostname.includes(".")||/^(localhost|127\\.0\\.0\\.1|0\\.0\\.0\\.0)$/.test(url.hostname)||url.hostname.endsWith(".local"))fail("Use a public website URL.");
 return url;
}
export function validateProfile(platform,raw){
 if(!RULES[platform])fail("Unsupported platform.");
 const u=urlOf(raw);
 if(u.search||u.hash)fail("Use a clean profile URL without parameters or fragments.");
 const path=decodeURIComponent(u.pathname);
 let id;
 switch(platform){
 case "imdb":
  if(!hostname(u.hostname,"imdb.com")||!/^\\/name\\/nm[0-9]+\\/?$/.test(path))fail("Use an IMDb person profile URL.");
  id=path.match(/nm[0-9]+/)[0];return {platform,id,url:"https://www.imdb.com/name/"+id+"/"};
 case "tmdb":
  if(!hostname(u.hostname,"themoviedb.org")||!/^\\/person\\/[0-9]+(?:-[a-zA-Z0-9-]+)?\\/?$/.test(path))fail("Use an existing TMDb person profile URL.");
  id=path.match(/\\/person\\/([0-9]+)/)[1];return {platform,id,url:"https://www.themoviedb.org/person/"+id};
 case "wikipedia":
  if(u.hostname!=="en.wikipedia.org"||!path.startsWith("/wiki/")||path.length<=6||/[<>|{}]/.test(path))fail("Use an existing English Wikipedia article URL.");
  id=path.slice(6);if(/^(Special:|User:|Talk:|Wikipedia:|Category:|Template:|Draft:)/i.test(id))fail("Use the existing article, not a namespace or draft.");
  return {platform,id,url:"https://en.wikipedia.org/wiki/"+encodeURIComponent(id).replace(/%2F/g,"/"),talkUrl:"https://en.wikipedia.org/wiki/Talk:"+encodeURIComponent(id)};
 case "wikidata":
  if(!hostname(u.hostname,"wikidata.org")||!/^\\/wiki\\/Q[1-9][0-9]*\\/?$/i.test(path))fail("Use an existing Wikidata Q-item page.");
  id=path.match(/Q[1-9][0-9]*/i)[0].toUpperCase();return {platform,id,url:"https://www.wikidata.org/wiki/"+id};
 case "linkedin":
  if(!hostname(u.hostname,"linkedin.com")||!/^\\/in\\/[a-zA-Z0-9%_.-]+\\/?$/.test(path))fail("Use a personal LinkedIn /in/ profile.");
  id=path.split("/")[2];return {platform,id,url:"https://www.linkedin.com/in/"+id+"/"};
 case "website":
  if(u.hostname.endsWith(".example")||u.hostname.endsWith(".test"))fail("Use a real owned website.");
  return {platform,id:u.hostname,url:u.origin+u.pathname};
 }
}
export function evidenceList(input){
 if(!Array.isArray(input)||input.length>15)fail("Provide up to 15 source URLs.");
 const seen=new Set(),out=[];
 for(const item of input){
  const raw=typeof item==="string"?item:item.url;
  const u=urlOf(raw);u.hash="";if(seen.has(u.href))continue;seen.add(u.href);
  const kind=typeof item==="string"?"unclassified":txt(item.kind,30)||"unclassified";
  if(!["independent","industry","first_party","unclassified"].includes(kind))fail("Invalid evidence type.");
  out.push({url:u.href,label:txt(typeof item==="string"?u.hostname:item.label||u.hostname,120),kind});
 }
 return out;
}
export function makeTask(data){
 const platform=txt(data.platform,30);
 const rule=RULES[platform];if(!rule)fail("Unsupported platform.");
 const subject=txt(data.subject,100), current=txt(data.current,1000), desired=txt(data.desired,1200);
 if(subject.length<2)fail("Enter a professional name.");
 if(current.length<3||desired.length<3)fail("Describe both the current and the correct information.");
 if(current.toLowerCase()===desired.toLowerCase())fail("The proposed value must differ from the current value.");
 const profile=validateProfile(platform,data.profileUrl);
 const evidence=evidenceList(data.evidence||[]);
 const requiresIndependent=platform==="wikipedia"||platform==="wikidata";
 const missing=[];
 if(evidence.length===0)missing.push("Add a public source supporting the correct information.");
 if(requiresIndependent&&!evidence.some(s=>s.kind==="independent"))missing.push("Add at least one independent source appropriate to this Wikimedia claim.");
 const owner=rule.channel==="owner";
 const id="task-"+platform+"-"+profile.id.replace(/[^a-zA-Z0-9]/g,"").slice(0,28)+"-"+Math.random().toString(36).slice(2,9);
 return {id,subject,platform,profile,current,desired,evidence,channel:rule.channel,
  status:missing.length?"needs_evidence":owner?"customer_action":"draft",
  missing,approved:false,reviewed:false,submissionId:null,verifiedUrl:null,
  createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
}
export function nextAction(task){
 const rule=RULES[task.platform];if(!rule)fail("Unknown platform.");
 if(task.status==="accepted")return "Correction verified.";
 if(task.status==="rejected")return "Review rejection and revise evidence.";
 if(task.missing.length)return "Add supporting evidence before sending.";
 if(rule.channel==="owner")return "Prepare an easy update for the profile or site owner.";
 if(rule.channel==="editorial_request")return "Review independent sources and disclose any paid affiliation before submitting a request.";
 return "Review the proposed correction, then use the platform contributor process.";
}
export function makePacket(task,{serviceName="Identity Lab",clientName=""}={}){
 const rule=RULES[task.platform];if(!rule)fail("Unsupported platform.");
 const title=rule.channel==="owner"?"CUSTOMER ACTION":rule.channel==="editorial_request"?"NEUTRAL CORRECTION REQUEST":"CONTRIBUTOR CORRECTION PACKET";
 const lines=[title,"Person: "+task.subject,"Platform: "+rule.label,"Record: "+task.profile.url,
  "CURRENT INFORMATION",task.current,"PROPOSED FACTUAL CORRECTION",task.desired,
  "SUPPORTING PUBLIC SOURCES",...(task.evidence.length?task.evidence.map(s=>"- "+s.label+" ("+s.kind+"): "+s.url):["- No sources supplied"]),
  "WORKFLOW",rule.method,rule.policy];
 if(task.platform==="wikipedia"){
  lines.push("DISCLOSURE TEMPLATE","I am proposing this factual correction on behalf of "+(clientName||task.subject)+" through "+serviceName+". I have a conflict of interest and will follow this project's disclosure and edit-request procedures.","Submit an edit request on the article talk page; do not directly replace the article on behalf of a client.");
 }
 if(task.platform==="wikidata")lines.push("DISCLOSURE","Disclose paid contributions and verify the statement, entity, property and reference before suggesting an existing-item correction.");
 if(task.platform==="linkedin")lines.push("OWNER TASK","Open your LinkedIn profile, edit the relevant section yourself, and check the public result. Do not share your password.");
 lines.push("STATUS","DRAFT ONLY. No platform account was accessed and no edit was submitted.");
 return lines.join("\\n\\n");
}
const transitions={needs_evidence:["draft"],draft:["ready_for_review","customer_action"],ready_for_review:["submitted","draft","customer_action"],submitted:["accepted","rejected"],customer_action:["accepted","draft"],accepted:[],rejected:["draft"]};
export function transition(task,target,{reviewed=false,approved=false,receipt="",verifiedUrl=""}={}){
 if(!transitions[task.status]?.includes(target))fail("Invalid status transition.");
 const rule=RULES[task.platform];if(!rule)fail("Unknown platform.");
 if(target==="draft"&&task.status==="needs_evidence"){
  const fresh=makeTask({...task,profileUrl:task.profile.url});
  if(fresh.missing.length)fail("Missing evidence.");
 }
 if(target==="ready_for_review"){
  if(task.missing.length||!task.evidence.length)fail("Resolve evidence gaps first.");
  if(rule.channel==="owner")fail("Owner-only edits require a customer action.");
  if(!reviewed)fail("A reviewer must confirm the supporting facts.");
 }
 if(target==="submitted"){
  if(rule.channel==="owner")fail("Owner-only edits cannot use contributor submission.");
  if(!reviewed||!approved)fail("Human evidence review and permission approval required.");
  if(txt(receipt,180).length<6)fail("Record a real submission reference.");
 }
 if(target==="accepted"){
  if(!approved)fail("A human must confirm the edit was accepted.");
  const v=urlOf(verifiedUrl);
  if(!hostname(v.hostname,new URL(task.profile.url).hostname.replace(/^www\\./,"")))fail("Verification must link to the same platform.");
 }
 return {...task,status:target,reviewed:task.reviewed||reviewed,approved:task.approved||approved,
  submissionId:target==="submitted"?txt(receipt,180):task.submissionId,
  verifiedUrl:target==="accepted"?txt(verifiedUrl,1000):task.verifiedUrl,updatedAt:new Date().toISOString()};
}
