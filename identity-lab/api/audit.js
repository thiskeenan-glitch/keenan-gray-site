// Identity Lab pilot: bounded, read-only public-web checks.
// No customer login, no third-party account edits, no persisted user records.
const ALLOWED = new Set(["thiskeenan.com", "www.thiskeenan.com"]);
const MAX_BYTES = 700000;
const PATHS = ["/", "/about", "/robots.txt", "/sitemap.xml"];

function cleanString(value, limit) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}
function validateWebsite(raw) {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || !ALLOWED.has(url.hostname.toLowerCase()) || url.username || url.password || url.port || (url.pathname !== "/" && url.pathname !== "") || url.search || url.hash) return null;
    return url.origin;
  } catch { return null; }
}
function attrs(html, tag) {
  const match = html.match(new RegExp("<" + tag + "\\b([^>]*)>", "i"));
  return match ? match[1] : "";
}
function attribute(source, name) {
  const re = new RegExp("(?:^|\\s)" + name.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&") + "\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s>]+))", "i");
  const match = source.match(re);
  return match ? (match[1] || match[2] || match[3] || "") : "";
}
function decode(text) {
  return String(text || "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
}
function strip(text) {
  return decode(String(text || "").replace(/<[^>]*>/g, " "));
}
function readMeta(html, name, key) {
  const re = /<meta\b([^>]*?)>/gi;
  let match;
  while ((match = re.exec(html))) {
    if ((attribute(match[1], key) || "").toLowerCase() === name.toLowerCase()) return attribute(match[1], "content");
  }
  return "";
}
function readLink(html, rel) {
  const re = /<link\b([^>]*?)>/gi;
  let match;
  while ((match = re.exec(html))) {
    if ((attribute(match[1], "rel") || "").toLowerCase().split(/\s+/).includes(rel)) return attribute(match[1], "href");
  }
  return "";
}
function collectJsonLd(html) {
  const graph = [];
  let match;
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
  while ((match = re.exec(html))) {
    if ((attribute(match[1], "type") || "").toLowerCase() !== "application/ld+json") continue;
    try {
      const value = JSON.parse(match[2]);
      const queue = Array.isArray(value) ? value : [value];
      for (const item of queue) {
        if (!item || typeof item !== "object") continue;
        if (Array.isArray(item["@graph"])) graph.push(...item["@graph"]);
        else graph.push(item);
      }
    } catch { /* Malformed schema should not fail the audit. */ }
  }
  return graph.filter(item => item && typeof item === "object");
}
function getTypes(value) {
  return Array.isArray(value) ? value : typeof value === "string" ? [value] : [];
}
function normalizeLink(value) {
  try { return new URL(String(value)).href.replace(/\/$/, "").toLowerCase(); }
  catch { return ""; }
}
function add(results, id, title, status, detail, url, category, recommendation) {
  results.push({id,title,status,detail,url:url||null,category,recommendation:recommendation||null});
}
async function readBytes(response) {
  const reader = response.body && response.body.getReader ? response.body.getReader() : null;
  if (!reader) return (await response.text()).slice(0,MAX_BYTES);
  const chunks = []; let size = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.byteLength;
      if (size > MAX_BYTES) { await reader.cancel(); throw new Error("Page too large for bounded audit"); }
      chunks.push(part.value);
    }
    const result = new Uint8Array(size);
    let offset = 0; for (const chunk of chunks) { result.set(chunk,offset); offset += chunk.byteLength; }
    return new TextDecoder().decode(result);
  } finally { try { reader.releaseLock(); } catch {} }
}
async function fetchPage(origin, path) {
  const initial = new URL(path, origin);
  let target = initial;
  const started = Date.now();
  for (let redirect = 0; redirect < 4; redirect++) {
    if (target.protocol !== "https:" || !ALLOWED.has(target.hostname.toLowerCase()) || target.username || target.password || target.port) {
      return {path,url:target.href,ok:false,status:0,error:"Redirect outside the pilot domain"};
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5500);
    try {
      const response = await fetch(target.href, {
        method:"GET",
        redirect:"manual",
        cache:"no-store",
        headers:{"User-Agent":"IdentityLabPilot/0.1 (+public SEO check)","Accept":"text/html,application/xml,text/xml,text/plain;q=0.8"},
        signal:controller.signal
      });
      if ([301,302,303,307,308].includes(response.status)) {
        const location = response.headers.get("location");
        if (!location) return {path,url:target.href,ok:false,status:response.status,error:"Redirect without destination"};
        target = new URL(location,target);
        continue;
      }
      if (!response.ok) return {path,url:target.href,ok:false,status:response.status,error:"HTTP "+response.status};
      const text = await readBytes(response);
      return {path,url:target.href,ok:true,status:response.status,ms:Date.now()-started,text};
    } catch (err) {
      return {path,url:target.href,ok:false,status:0,error:err && err.name==="AbortError" ? "Timed out" : String(err.message || "Network failure").slice(0,140)};
    } finally { clearTimeout(timeout); }
  }
  return {path,url:target.href,ok:false,status:0,error:"Too many redirects"};
}

async function generateAiSummary(results, name, requestKey) {
  // AI is opt-in and disabled unless both secrets have been configured.
  if (!process.env.OPENAI_API_KEY || !process.env.AUDIT_ACCESS_KEY || requestKey !== process.env.AUDIT_ACCESS_KEY) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const payload = {
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      max_output_tokens: 260,
      input: [
        {role:"system",content:"You are a cautious technical SEO auditor. Give three short sentences about the evidence-only findings. Never claim Google indexing, Knowledge Panel eligibility, or reciprocal third-party profile links were verified. Do not invent data or make guarantees."},
        {role:"user",content:JSON.stringify({subject:name,findings:results.map(x=>({title:x.title,status:x.status,detail:x.detail}))})}
      ]
    };
    const response = await fetch("https://api.openai.com/v1/responses",{
      method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+process.env.OPENAI_API_KEY},
      body:JSON.stringify(payload),signal:controller.signal
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (typeof data.output_text==="string") return data.output_text.trim();
    return (data.output||[]).flatMap(item=>(item.content||[])).filter(c=>c.type==="output_text").map(c=>c.text).join("\n").trim() || null;
  } catch { return null; }
  finally { clearTimeout(timeout); }
}

export default async function handler(req,res) {
  res.setHeader("Cache-Control","no-store");
  res.setHeader("X-Content-Type-Options","nosniff");
  if (req.method !== "POST") return res.status(405).json({error:"Use POST to run an audit."});
  let data;
  try { data = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {}; }
  catch { return res.status(400).json({error:"Invalid request body."}); }
  const website = validateWebsite(cleanString(data.website,250));
  const name = cleanString(data.name,100);
  const imdb = cleanString(data.imdb,250);
  if (!website || name.length < 2 || name.length > 100) {
    return res.status(400).json({error:"This pilot only scans https://www.thiskeenan.com or https://thiskeenan.com, with a subject name."});
  }
  let imdbUrl = "";
  if (imdb) {
    try {
      const url = new URL(imdb);
      if (url.protocol !== "https:" || !["www.imdb.com","imdb.com"].includes(url.hostname.toLowerCase()) || !/^\/name\/nm\d+\/?$/.test(url.pathname)) throw Error("IMDb profile URL expected");
      imdbUrl = url.href;
    } catch { return res.status(400).json({error:"Please use an IMDb profile URL such as https://www.imdb.com/name/nm16096261/."}); }
  }
  const pages = await Promise.all(PATHS.map(path=>fetchPage(website,path)));
  const home=pages[0], about=pages[1], robots=pages[2], sitemap=pages[3];
  const homeHtml=home.ok?home.text:"";
  const aboutHtml=about.ok?about.text:"";
  const schema=collectJsonLd(homeHtml).concat(collectJsonLd(aboutHtml));
  const people=schema.filter(x=>getTypes(x["@type"]).some(t=>/^(Person|https?:\/\/schema.org\/Person)$/i.test(t)));
  const profileLinks=[...new Set(people.flatMap(p=>Array.isArray(p.sameAs)?p.sameAs: p.sameAs?[p.sameAs]:[]).filter(x=>typeof x==="string"))];
  const hrefs=[];
  for (const [label,html] of [["homepage",homeHtml],["about",aboutHtml]]) {
    let match; const re=/<a\b([^>]*?)>/gi;
    while ((match=re.exec(html))) {const href=attribute(match[1],"href"); if(href) hrefs.push({label,href});}
  }
  const normImdb=normalizeLink(imdbUrl);
  const schemaImdb=normImdb && profileLinks.some(u=>normalizeLink(u)===normImdb);
  const visibleImdb=normImdb && hrefs.some(u=>normalizeLink(u.href)===normImdb);
  const homeRobots=readMeta(homeHtml,"robots","name");
  const googleRobots=readMeta(homeHtml,"googlebot","name");
  const title=(homeHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i)||[])[1]||"";
  const description=readMeta(homeHtml,"description","name");
  const canonical=readLink(homeHtml,"canonical");
  const aboutH1=strip((aboutHtml.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)||[])[1]||"");
  const results=[];
  const source=home.url||website+"/";
  const aboutSource=about.url||website+"/about";
  add(results,"reach","Website is reachable",home.ok?"pass":"unknown",home.ok?"Homepage returned HTTP "+home.status+".":"Homepage could not be inspected: "+home.error,source,"Technical");
  add(results,"identity","Person identity schema",!home.ok?"unknown":people.length?"pass":"action",!home.ok?"Unable to inspect HTML.":people.length?people.length+" Person schema object(s) found on the website. " +(people[0]&&people[0].name?"Name: "+people[0].name+".":""): "No Person JSON-LD found. Add accurate Person schema with a stable URL.",source,"Identity","Add an accurate Person JSON-LD record if the site lacks one.");
  add(results,"sameas","IMDb included in identity graph",!home.ok?"unknown":!imdbUrl?"unknown":schemaImdb?"pass":"action",!home.ok?"Site could not be inspected.":!imdbUrl?"Provide an IMDb profile to test this link.":schemaImdb?"IMDb profile found in Person.sameAs.":"Person.sameAs did not contain the supplied IMDb URL.",source,"Connections","If missing, add the verified IMDb profile to Person.sameAs.");
  add(results,"visible","Visible link to IMDb",!home.ok&&!about.ok?"unknown":!imdbUrl?"unknown":visibleImdb?"pass":"action",!imdbUrl?"No IMDb URL supplied.":visibleImdb?"An anchor link to IMDb was found in homepage/about HTML.":"No matching IMDb anchor was found in sampled public pages.",about.ok?aboutSource:source,"Connections","Place a visible link to the verified IMDb profile on an appropriate page.");
  add(results,"bio","About page accessible",about.ok?"pass":"unknown",about.ok?"About page returned HTTP "+about.status+".":"Could not verify /about: "+about.error,aboutSource,"Identity");
  add(results,"heading","Descriptive About page heading",!about.ok?"unknown":aboutH1&&aboutH1.toLowerCase().includes(name.toLowerCase())?"pass":"action",!about.ok?"About page not accessible.":"H1: "+(aboutH1?"“"+aboutH1+"”":"none found")+". An explicit name heading makes the page clearer to visitors.",aboutSource,"Identity","Consider an H1 such as "+name+" — Film Director.");
  const directives=(homeRobots+" "+googleRobots).toLowerCase();
  add(results,"indexable","No obvious noindex directive",!home.ok?"unknown":/\bnoindex\b/.test(directives)?"action":"pass",!home.ok?"Homepage unavailable.":/\bnoindex\b/.test(directives)?"Homepage contains a noindex directive.":"No noindex meta directive detected. This does not prove Google has indexed the page.",source,"Technical","Remove an accidental noindex directive if the site should be searchable.");
  add(results,"description","Homepage search description",!home.ok?"unknown":description?"pass":"action",description?"Meta description found: "+description.slice(0,200):"No homepage meta description detected.",source,"Technical","Add a concise accurate homepage meta description.");
  add(results,"canonical","Canonical URL",!home.ok?"unknown":canonical?"pass":"action",canonical?"Canonical link points to "+canonical+".":"No canonical link found in sampled HTML.",source,"Technical","Add an appropriate canonical link.");
  add(results,"sitemap","XML sitemap available",sitemap.ok&&(/<urlset\b|<sitemapindex\b/i.test(sitemap.text))?"pass":sitemap.ok?"action":"unknown",sitemap.ok?"Sitemap returned HTTP "+sitemap.status+( /<urlset\b|<sitemapindex\b/i.test(sitemap.text)?" and an XML sitemap structure was detected.":" but its XML structure was not recognized."):"Sitemap not verified: "+sitemap.error,sitemap.url||website+"/sitemap.xml","Technical","Review sitemap.xml and register the property in Search Console.");
  add(results,"robots","Robots.txt accessible",robots.ok?"pass":"unknown",robots.ok?"robots.txt returned HTTP "+robots.status+".":"robots.txt not verified: "+robots.error,robots.url||website+"/robots.txt","Technical");
  add(results,"reciprocal","IMDb links back to the website","manual","Not tested. Editing or verifying reciprocal IMDb links may require IMDb's contribution process or account access.",imdbUrl||null,"External verification","Check the official website field in the IMDb profile through authorized IMDb tools.");
  add(results,"searchconsole","Google Search Console ownership and indexing","manual","Not tested. Requires Search Console access. Robots, schema, and sitemaps are not proof of indexing.",null,"External verification","Open Search Console and inspect the canonical URL with URL Inspection.");
  add(results,"panel","Google Knowledge Panel appearance","manual","Not tested. Google independently determines whether and when Knowledge Panels appear.",null,"External verification","Record dated manual Google Search results for the name; monitor for changes.");
  const priority=results.filter(x=>x.status==="action").map(x=>({title:x.title,description:x.recommendation||x.detail,source:x.url}));
  const summary={
    pass:results.filter(x=>x.status==="pass").length,
    action:results.filter(x=>x.status==="action").length,
    manual:results.filter(x=>x.status==="manual").length,
    unknown:results.filter(x=>x.status==="unknown").length
  };
  const aiSummary=await generateAiSummary(results,name,cleanString(req.headers["x-audit-key"],150));
  return res.status(200).json({
    version:"0.1.0",generatedAt:new Date().toISOString(),subject:{name,website,imdb:imdbUrl},
    summary,results,priority,aiSummary,
    detected:{title:strip(title),description,canonical,aboutHeading:aboutH1,schemaPersonCount:people.length,profileLinks},
    pages:pages.map(page=>({path:page.path,url:page.url,status:page.status,ok:page.ok,error:page.error||null,ms:page.ms||null})),
    disclaimer:"A technical site audit, not a Google indexing test or a Knowledge Panel eligibility determination. No account changes were made."
  });
}
