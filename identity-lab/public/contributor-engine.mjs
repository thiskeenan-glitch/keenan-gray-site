/* Identity Lab contributor adapters, version 1.
 * Drafts legitimate platform submissions. Never logs in or writes to IMDb/TMDb.
 * No private information or credentials should be stored here.
 */
export const PROVIDERS = Object.freeze({
  imdb: Object.freeze({
    label: "IMDb",
    channel: "registered-contributor",
    apiWriteSupported: false,
    editMethod: "Official Edit Page / contribution form",
    review: "IMDb editorial review; an IMDbPro-claimed biography may be owner-locked",
    help: "https://help.imdb.com/article/contribution/names-biographical-data/how-can-i-delete-or-update-my-biography/GX5BSYZH2QZEX49A"
  }),
  tmdb: Object.freeze({
    label: "TMDb",
    channel: "registered-contributor",
    apiWriteSupported: false,
    editMethod: "Official website editor after contributor login",
    review: "TMDb contributor access and platform validation",
    help: "https://www.themoviedb.org/bible"
  })
});
const LIMITS = Object.freeze({name: 100, biography: 10000, sourceCount: 12});
const assert = (condition, message) => { if(!condition) throw new Error(message); };
function string(value, limit = 1000) { return String(value ?? "").trim().slice(0, limit); }
export function parseProfile(provider, raw) {
  const value=string(raw,500);
  assert(value,"Enter a "+provider+" profile URL.");
  let url;
  try{url=new URL(value);}catch{throw new Error("Enter a valid profile URL.");}
  assert(url.protocol==="https:"&&!url.username&&!url.password&&!url.port&&!url.search&&!url.hash,"Use a clean HTTPS profile URL.");
  if(provider==="imdb"){
    assert(["imdb.com","www.imdb.com"].includes(url.hostname),"Use an IMDb URL.");
    const m=url.pathname.match(/^\/name\/(nm\d+)\/?$/);
    assert(m,"Use the person's IMDb name page, e.g. /name/nm1234567/.");
    return {provider,id:m[1],url:"https://www.imdb.com/name/"+m[1]+"/"};
  }
  if(provider==="tmdb"){
    assert(["themoviedb.org","www.themoviedb.org"].includes(url.hostname),"Use a TMDb URL.");
    const m=url.pathname.match(/^\/person\/(\d+)(?:-[a-zA-Z0-9-]+)?\/?$/);
    assert(m,"Use an existing TMDb person page.");
    return {provider,id:m[1],url:"https://www.themoviedb.org/person/"+m[1]};
  }
  throw new Error("Provider not supported.");
}
export function validateBiography(bio) {
  const text=string(bio,LIMITS.biography+1);
  const count=text.split(/\s+/).filter(Boolean).length;
  const problems=[];
  if(text.length>LIMITS.biography) problems.push("Biography exceeds 10,000 characters.");
  if(count<50) problems.push("IMDb requires a biography of at least 50 words.");
  if(/(?:^|[.!?]\s+)(?:I|My|We)\b/.test(text)) problems.push("Use a factual third-person biography.");
  return {valid:problems.length===0,wordCount:count,problems,text};
}
export function sanitizeEvidence(values) {
  assert(Array.isArray(values),"Evidence must be a list.");
  assert(values.length<=LIMITS.sourceCount,"Too many evidence sources.");
  const seen=new Set(), result=[];
  for(const record of values){
    const raw=typeof record==="string"?record:record.url;
    let url;
    try{url=new URL(string(raw,1000));}catch{throw new Error("Invalid evidence URL.");}
    assert(url.protocol==="https:"&&!url.username&&!url.password&&!url.port,"Evidence links must be public HTTPS URLs.");
    assert(!/^(localhost|127\.0\.0\.1|0\.0\.0\.0)$/.test(url.hostname)&&!url.hostname.endsWith(".local"),"Only public evidence links are allowed.");
    url.hash="";
    const canonical=url.href;
    if(!seen.has(canonical)){seen.add(canonical);result.push({url:canonical,label:string(record.label||url.hostname,120),type:string(record.type||"Source",50)});}
  }
  return result;
}
export function makeCase({name,imdbUrl,tmdbUrl,biography,evidence=[],imdbClaimedLocked=false}) {
  const subject=string(name,LIMITS.name);
  assert(subject.length>=2,"Enter a person's public professional name.");
  const imdb=imdbUrl?parseProfile("imdb",imdbUrl):null;
  const tmdb=tmdbUrl?parseProfile("tmdb",tmdbUrl):null;
  assert(imdb||tmdb,"At least one verified profile URL is required.");
  const bio=validateBiography(biography);
  const sources=sanitizeEvidence(evidence);
  const tasks=[];
  const base={subject,description:bio.text,evidence:sources,preparedAt:new Date().toISOString()};
  const insert=(id,platform,operation,title,profile,blocked,notes)=>{
    tasks.push({...base,id,platform,operation,title,profile,status:blocked?"needs_owner":"draft",blocked,notes,
      writeChannel:blocked?"owner":"registered-contributor",submissionReceipt:null,publicVerification:null,
      requirements:bio.problems.slice(),approvedForSubmission:false});
  };
  if(imdb){
    insert("imdb-bio","imdb","biography","Update biography",imdb,Boolean(imdbClaimedLocked),
      imdbClaimedLocked?"IMDbPro-claimed biography: outside contributor overwrite unavailable. Owner action required.":
      "Existing biography corrections should be similar in length to current entry. IMDb may decline corrections.");
    tasks.push({...base,id:"imdb-links",platform:"imdb",operation:"external_links",title:"Check professional external links",
      profile:imdb,status:"needs_source_review",blocked:false,notes:"Link only already published professional coverage through official IMDb external links; independent sources must not be invented.",
      writeChannel:"registered-contributor",submissionReceipt:null,publicVerification:null,
      requirements:["Choose URLs relevant to this particular person and IMDb contribution category."],approvedForSubmission:false});
  }
  if(tmdb){
    insert("tmdb-bio","tmdb","biography","Correct profession and biography",tmdb,false,
      "Inspect existing film credits and set the correct primary department if the website permits. Do not invent film records.");
    tasks.push({...base,id:"tmdb-credits",platform:"tmdb",operation:"filmography",title:"Check missing film credits",
      profile:tmdb,status:"needs_source_review",blocked:false,notes:"Existing film and crew records must be matched by exact title, release year and credited role before editing. Avoid duplicates.",
      writeChannel:"registered-contributor",submissionReceipt:null,publicVerification:null,
      requirements:["Verify each film's existing TMDb ID and on-screen credit independently."],approvedForSubmission:false});
  }
  return {schemaVersion:1,subject,imdb,tmdb,biography:bio,evidence:sources,tasks,notice:"Drafts only: no outside accounts have been accessed or edited. Acceptance and Google panel appearance are not guaranteed."};
}
export function buildPacket(task) {
  assert(task&&PROVIDERS[task.platform],"Unknown correction provider.");
  const lines=[
    "IDENTITY LAB — EVIDENCE-BACKED CORRECTION",
    "Person: "+task.subject,
    "Provider: "+PROVIDERS[task.platform].label,
    "Record: "+task.profile.url,
    "Correction: "+task.title,
    "Method: "+PROVIDERS[task.platform].editMethod,
    "",
    "PROPOSED FACTUAL BIOGRAPHY",
    task.description || "(No biography supplied)",
    "",
    "EVIDENCE",
    ...(task.evidence.length?task.evidence.map((e,i)=>(i+1)+". "+e.label+" — "+e.url):["Missing: add public evidence before submission."]),
    "",
    "REVIEW NOTES",
    task.notes,
    ...(task.requirements||[]).map(x=>"- "+x),
    "",
    "No platform edit has been made by generating this packet."
  ];
  return lines.join("\n");
}
export function updateTask(task, nextStatus, payload={}) {
  const states=["draft","needs_source_review","needs_owner","ready_for_review","submitted","accepted","rejected"];
  assert(states.includes(nextStatus),"Unknown status.");
  const allowed={
    draft:["needs_source_review","needs_owner","ready_for_review"],
    needs_source_review:["draft","needs_owner","ready_for_review"],
    needs_owner:["draft","ready_for_review"],
    ready_for_review:["submitted","draft","needs_owner"],
    submitted:["accepted","rejected"],
    accepted:[],
    rejected:["draft"]
  };
  assert(allowed[task.status]?.includes(nextStatus),"Invalid workflow transition.");
  if(nextStatus==="ready_for_review"){
    assert(task.evidence?.length>0,"At least one public supporting source is required.");
    assert((task.requirements||[]).length===0,"Resolve missing requirements before marking ready.");
    assert(!task.blocked,"An owner-locked record cannot use contributor submission.");
  }
  if(nextStatus==="submitted"){
    assert(task.approvedForSubmission===true,"A human must approve the correction.");
    assert(string(payload.receipt,300).length>=5,"A real platform submission reference is required.");
  }
  if(nextStatus==="accepted"){
    const v=string(payload.publicVerification,1000);
    assert(v.startsWith("https://"),"An accepted change requires a public verification URL.");
  }
  return {...task,status:nextStatus,
    submissionReceipt:nextStatus==="submitted"?string(payload.receipt,300):task.submissionReceipt,
    publicVerification:nextStatus==="accepted"?string(payload.publicVerification,1000):task.publicVerification,
    lastUpdatedAt:new Date().toISOString()};
}
