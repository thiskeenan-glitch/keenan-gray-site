// Ulab public identity cards: strict self-published content validation + safe HTML.
// No third-party writes. Profiles on this beta domain have noindex headers until verified.
const tidy=(value,max)=>String(value??"").replace(/[\u0000-\u001f\u007f]/g," ").replace(/\s+/g," ").trim().slice(0,max);
const reserved=new Set(["admin","api","support","help","login","logout","account","google","ulab","root","system","null","test"]);
export function parseSlug(raw){
 const slug=tidy(raw,50).toLowerCase();
 if(slug.length<3||slug.length>48||!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug)||reserved.has(slug))
  throw Error("Use a unique slug of 3 to 48 lowercase letters, numbers or hyphens.");
 return slug;
}
export function publicUrl(raw){
 if(!raw)return null;
 let u;try{u=new URL(tidy(raw,1100));}catch{throw Error("Use a full HTTPS website or profile URL.");}
 const host=u.hostname.toLowerCase();
 if(u.protocol!=="https:"||u.username||u.password||u.port||
 !host.includes(".")||host==="localhost"||host.endsWith(".local")||host.endsWith(".internal")||
 /^(\d{1,3}\.){3}\d{1,3}$/.test(host)||host.startsWith("["))
  throw Error("Only public HTTPS website and profile links are supported.");
 u.hash="";return u.toString().slice(0,1000);
}
export function cleanIdentityInput(input){
 const slug=parseSlug(input?.slug);
 const display_name=tidy(input?.display_name,101);
 const headline=tidy(input?.headline,181);
 if(display_name.length<2||display_name.length>100)throw Error("Provide a name between 2 and 100 characters.");
 if(headline.length>180)throw Error("Keep the description under 180 characters.");
 const website_url=publicUrl(input?.website_url);
 const raw=Array.isArray(input?.profile_urls)?input.profile_urls:String(input?.profile_urls||"").split(/\n|,/);
 if(raw.length>12)throw Error("Add at most 8 public profile URLs.");
 const profile_urls=[...new Set(raw.map(x=>publicUrl(x)).filter(Boolean))];
 if(profile_urls.length>8)throw Error("Add no more than eight public profile URLs.");
 if(!website_url&&!profile_urls.length)throw Error("Add an official website or at least one professional profile link.");
 return {slug,display_name,headline,website_url,profile_urls};
}
export function makeIdentityWrite(input,previous,{publish=false,attested=false}={}){
 const fields=cleanIdentityInput(input);
 if(previous?.slug&&previous.slug!==fields.slug)throw Error("The public slug cannot be renamed after creation.");
 if(publish&&!attested)throw Error("Check the ownership and accuracy confirmation before publishing.");
 return {...fields,
  state:publish?"published":"draft",
  owner_attestation:publish&&attested,
  version:(Number.isInteger(previous?.version)&&previous.version>0?previous.version:0)+1,
  published_at:publish?new Date().toISOString():null,
  updated_at:new Date().toISOString()
 };
}
const html=s=>String(s??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const jsonForHtml=data=>JSON.stringify(data).replace(/[<>&\u2028\u2029]/g,ch=>({
 "<":"\\u003c",">":"\\u003e","&":"\\u0026","\u2028":"\\u2028","\u2029":"\\u2029"
})[ch]);
export function safePublicFields(row){
 if(!row||row.state!=="published")return null;
 try{
  const record={
   slug:parseSlug(row.slug),
   display_name:tidy(row.display_name,100),
   headline:tidy(row.headline,180),
   website_url:publicUrl(row.website_url),
   profile_urls:(Array.isArray(row.profile_urls)?row.profile_urls:[]).slice(0,8).map(publicUrl).filter(Boolean),
   state:"published",
   version:Number.isInteger(row.version)&&row.version>0?row.version:1,
   published_at:typeof row.published_at==="string"?row.published_at:null
  };
  if(record.display_name.length<2)return null;
  return record;
 }catch{return null;}
}
export function profileHtml(row,{origin="https://ulab.example",preview=true}={}){
 const data=safePublicFields(row);
 if(!data)throw Error("Only published records may be rendered.");
 const base=new URL(origin);
 if(base.protocol!=="https:")throw Error("HTTPS origin required.");
 const canonical=base.origin+"/u/"+encodeURIComponent(data.slug);
 const links=[...(data.website_url?[data.website_url]:[]),...data.profile_urls];
 const uniqueLinks=[...new Set(links)];
 const ld={"@context":"https://schema.org","@type":"Person",name:data.display_name,
  url:canonical,sameAs:uniqueLinks};
 if(data.headline)ld.description=data.headline;
 const anchor=url=>'<li><a href="'+html(url)+'" rel="noopener noreferrer nofollow" target="_blank">'+html(new URL(url).hostname.replace(/^www\./,""))+'</a></li>';
 return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
  '<meta name="robots" content="noindex,nofollow"><title>'+html(data.display_name)+' | Ulab identity record</title>'+
  '<meta name="description" content="'+html(data.headline||"Self-published professional identity record.")+'">'+
  '<link rel="canonical" href="'+html(canonical)+'">'+
  '<meta property="og:title" content="'+html(data.display_name)+' | Ulab">'+
  '<script type="application/ld+json">'+jsonForHtml(ld)+'</script>'+
  '<script id="ulab-public-record" type="application/json">'+jsonForHtml(data)+'</script>'+
  '<style>:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;padding:0;background:#090b14;color:#f3f1fb;font:15px/1.6 system-ui,-apple-system,sans-serif}a{color:#c9b3ff}.wrap{max-width:750px;margin:0 auto;padding:48px 24px}.brand{font-weight:800;letter-spacing:-1px;font-size:23px;color:#c9b3ff;text-decoration:none}h1{font-size:clamp(35px,6vw,66px);line-height:1.05;letter-spacing:-.055em;margin:78px 0 18px}.headline{font-size:18px;color:#c6c6d7}.box{border:1px solid #383650;background:#171927;border-radius:14px;padding:24px;margin-top:40px}ul{padding-left:20px}li{margin:8px 0}.small{font-size:12px;color:#9596ab}.tag{font-size:11px;font-weight:700;letter-spacing:.06em;color:#c7b0fa}.footer{margin-top:65px;border-top:1px solid #3b3850;padding-top:20px}</style>'+
  '</head><body><main class="wrap" data-ulab-slug="'+html(data.slug)+'" data-ulab-version="'+data.version+'">'+
  '<a class="brand" href="/">u. ulab</a><p class="tag">PUBLIC IDENTITY RECORD / BETA</p>'+
  '<h1>'+html(data.display_name)+'</h1><p class="headline">'+html(data.headline||"Professional identity record")+'</p>'+
  '<section class="box"><strong>Published professional links</strong><ul>'+uniqueLinks.map(anchor).join("")+'</ul>'+
  '<p class="small">Links and statements were submitted by the account holder. Ulab has not independently verified this person or their ownership of third-party profiles.</p></section>'+
  '<footer class="footer small">Published through Ulab · Version '+data.version+' · Public profile pilot · Search indexing disabled until identity verification.</footer>'+
  '</main></body></html>';
}
export function verifyPublicPayload(record,expected){
 if(!record||!expected||record.state!=="published")return {status:"not_visible",matched:false};
 const data=safePublicFields(record);
 if(!data)return {status:"invalid_public_record",matched:false};
 const fields=cleanIdentityInput(expected);
 const mismatches=[];
 for(const key of ["slug","display_name","headline","website_url"]){
  if((data[key]||null)!==(fields[key]||null))mismatches.push(key);
 }
 if(JSON.stringify(data.profile_urls)!==JSON.stringify(fields.profile_urls))mismatches.push("profile_urls");
 if(Number(expected.version)!==data.version)mismatches.push("version");
 return {status:mismatches.length?"changed_or_stale":"verified_public_http",
  matched:mismatches.length===0,observedVersion:data.version,mismatches};
}
