// Pure validation utilities for browser auth workspace. No network or persistent storage.
const trim=(v,n)=>String(v??"").trim().slice(0,n);
export function validPublicConfig(data){
  if(!data||data.enabled!==true||typeof data.publishableKey!=="string"||!/^sb_publishable_[A-Za-z0-9_-]{10,}$/.test(data.publishableKey))return false;
  try{const u=new URL(data.url);return u.protocol==="https:"&&/^[a-z0-9-]+\.supabase\.co$/.test(u.hostname)&&u.pathname==="/"&&!u.search&&!u.hash&&!u.username&&!u.password;}catch{return false;}
}
export function cleanCaseFields(input){
  const subject=trim(input?.subject,101),summary=trim(input?.summary,1001);
  if(subject.length<2||subject.length>100)throw new Error("Enter a name between 2 and 100 characters.");
  if(summary.length>1000)throw new Error("Keep the explanation under 1,000 characters.");
  let website_url=null;
  if(String(input?.website_url||"").trim()){
    let u;try{u=new URL(String(input.website_url).trim());}catch{throw new Error("Enter a valid website URL.");}
    if(u.protocol!=="https:"||u.username||u.password||u.port||u.hostname==="localhost"||!u.hostname.includes(".")||u.hostname.endsWith(".local"))throw new Error("Use a public HTTPS website.");
    website_url=u.origin+u.pathname+(u.search||"");
  }
  return {subject,summary,website_url};
}
export function cleanNote(text){
  const body=String(text??"").trim();
  if(body.length<3||body.length>3000)throw new Error("Use 3 to 3,000 characters for a note.");
  return body;
}
export function statusLabel(status){
  return {intake:"Awaiting review",in_review:"Evidence review",customer_action:"Your action needed",submitted:"Submission recorded",monitoring:"Monitoring public results",closed:"Closed"}[status]||"Status unknown";
}
