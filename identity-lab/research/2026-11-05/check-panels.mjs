// Google Search panel-observation pilot. This script never modifies third-party accounts.
// Requires SERPAPI_KEY in the environment. Do not commit or log the key.
// Run: node research/2026-11-05/check-panels.mjs --limit 5
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

function parseCsv(s) {
  const rows = []; let row = []; let field = ""; let quoted = false;
  for (let i=0; i<s.length; i++) {
    const c=s[i];
    if (c==='"') {
      if (quoted && s[i+1]==='"') { field+='"'; i++; }
      else quoted=!quoted;
    } else if (c===',' && !quoted) { row.push(field); field=""; }
    else if ((c==='\n'||c==='\r') && !quoted) {
      if (c==='\r' && s[i+1]==='\n') i++;
      row.push(field); field="";
      if (row.some(Boolean)) rows.push(row);
      row=[];
    } else field+=c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [head,...data]=rows;
  return data.map(r => Object.fromEntries(head.map((h,i)=>[h,r[i]??""])));
}
function csvCell(s) { return '"' + String(s??"").replaceAll('"','""') + '"'; }
function arg(name, fallback) {
  const i=process.argv.indexOf(name);
  return i<0 ? fallback : process.argv[i+1];
}
function clean(s) {
  return String(s??"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"")
    .toLowerCase().replace(/\([^)]*\)/g,"").replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();
}
function titleMatches(name, title) {
  if (!title) return false;
  const a=clean(name), b=clean(title);
  return a===b || b.startsWith(a+" ");
}
function analyze(name, query, data) {
  const kg=data.knowledge_graph;
  const res={query, checked_at:new Date().toISOString(), request_status:data.search_metadata?.status??"unknown",
    panel_observation:"not_observed_for_query", panel_title:kg?.title??"", panel_type:kg?.type??"",
    panel_description:kg?.description??"", google_results_url:data.search_metadata?.google_url??"",
    serpapi_id:data.search_metadata?.id??"", top_organic_links:(data.organic_results??[]).slice(0,5).map(x=>x.link).filter(Boolean)};
  if (data.error || data.search_metadata?.status==="Error") {
    res.panel_observation="unknown_api_error"; res.error=String(data.error??"API error");
  } else if (kg) {
    res.panel_observation=titleMatches(name,kg.title)?"possible_name_match_requires_human_review":"other_entity_panel";
  }
  return res;
}
const key=process.env.SERPAPI_KEY;
if (!key) { console.error("Set SERPAPI_KEY as a GitHub Actions repository secret, not in source code."); process.exit(2); }
const here=dirname(fileURLToPath(import.meta.url));
const people=parseCsv(readFileSync(join(here,"candidate-cohort-40.csv"),"utf8"));
const limit=Math.max(1, Math.min(40, Number(arg("--limit","5"))||5));
const offset=Math.max(0,Math.min(39,Number(arg("--offset","0"))||0));
const selected=people.slice(offset,offset+limit);
const results=[];
for (const p of selected) {
  const queries=[p.query_name,p.query_role];
  const observations=[];
  for(const q of queries) {
    const url=new URL("https://serpapi.com/search.json");
    url.searchParams.set("engine","google");
    url.searchParams.set("q",q);
    url.searchParams.set("gl","us");
    url.searchParams.set("hl","en");
    url.searchParams.set("location","New York, New York, United States");
    url.searchParams.set("api_key",key);
    let outcome;
    try {
      const response=await fetch(url,{signal:AbortSignal.timeout(30000)});
      const body=await response.json();
      if (!response.ok) body.error=body.error??("HTTP "+response.status);
      outcome=analyze(p.name,q,body);
    } catch(e) {
      outcome={query:q,checked_at:new Date().toISOString(),panel_observation:"unknown_transport_error",error:String(e.message??e)};
    }
    observations.push(outcome);
    // Throttle requests and do not silently retry billable API queries.
    await new Promise(resolve=>setTimeout(resolve,350));
  }
  let overall="not_observed_in_two_queries";
  if(observations.some(o=>o.panel_observation==="possible_name_match_requires_human_review")) overall="possible_panel_needs_human_confirmation";
  else if(observations.some(o=>o.panel_observation.startsWith("unknown"))) overall="unknown";
  else if(observations.some(o=>o.panel_observation==="other_entity_panel")) overall="other_entity_panel_observed";
  results.push({name:p.name,cohort:p.cohort,category:p.category,role:p.distinguishing_role,
    source:p.seed_evidence_url,overall,observations});
  console.log([p.name,overall].join(" | "));
}
const dest=join(here,"results");
mkdirSync(dest,{recursive:true});
writeFileSync(join(dest,"panel-observations.json"),JSON.stringify({
  generated_at:new Date().toISOString(),locale:"en-US",location:"New York, New York, United States",
  caveat:"Observations are query-dependent. A matching title is not validated as the right person, and lack of a visible panel is not proof of absence globally.",
  result_count:results.length,results},null,2)+"\n");
const head=["name","cohort","category","role","overall","name_query_status","role_query_status","name_panel_title","role_panel_title","source"];
const flat=results.map(r=>[r.name,r.cohort,r.category,r.role,r.overall,
  r.observations[0]?.panel_observation,r.observations[1]?.panel_observation,
  r.observations[0]?.panel_title,r.observations[1]?.panel_title,r.source]);
writeFileSync(join(dest,"panel-observations.csv"),[head.join(","),...flat.map(x=>x.map(csvCell).join(","))].join("\n")+"\n");
console.log("Saved results for "+results.length+" people. Query-specific observations require human verification before classifying panel status.");
