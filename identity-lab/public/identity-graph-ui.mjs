// Ulab identity graph inspector. Render data with textContent, never trusted HTML.
const el=(tag,cls="",txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=String(txt);return n;};
function safeLink(url){
 try{const u=new URL(url);if(u.protocol!=="https:")return null;
  const a=el("a","graph-link",u.hostname.replace(/^www\./,"")+u.pathname.slice(0,90));
  a.href=u.href;a.target="_blank";a.rel="noopener noreferrer";return a;
 }catch{return null;}
}
function itemLink(parent,url){const a=safeLink(url);if(a)parent.append(a);}
function fact(parent,label,detail,url,state){
 const block=el("div","graph-record");
 block.append(el("strong","",label));
 if(detail)block.append(el("p","",detail));
 if(url)itemLink(block,url);
 if(state)block.append(el("p","tag",state));
 parent.append(block);
}
export function renderIdentityGraph(parent,graph,comparison){
 const shell=el("details","identity-graph");
 shell.open=true;
 shell.append(el("summary","identity-graph-heading",
  graph?"IDENTITY GRAPH · "+graph.overview.sourceCount+" SOURCES":"IDENTITY GRAPH · NOT SCANNED"));
 if(!graph){
  shell.append(el("p","empty","Run the audit to establish a source-backed identity map and first monitoring baseline."));
  parent.append(shell);return;
 }
 const stats=el("div","report-meta");
 for(const [count,label] of [
  [graph.overview.linkedCandidates,"CROSSLINKED · VERIFY"],
  [graph.overview.contextualCandidates,"CONTEXTUAL"],
  [graph.overview.unverifiedCandidates,"UNVERIFIED"]
 ]){
  const block=el("div");block.append(el("strong","",count),el("span","",label));stats.append(block);
 }
 shell.append(stats);
 shell.append(el("p","empty","Snapshot "+new Date(graph.generatedAt).toLocaleString()+" · "+graph.research.status+" search coverage · no account access"));
 const categories=[
  ["LINKED PROFILES",["site_sameas","linked_identifier"]],
  ["CONTEXTUAL CONNECTIONS",["contextual_candidate"]],
  ["NAMESAKES / UNVERIFIED",["unverified_name_match","indexed_source"]],
  ["STARTING REFERENCE",["official_anchor"]]
 ];
 for(const [title,types] of categories){
  const nodes=graph.nodes.filter(n=>types.includes(n.type));
  shell.append(el("h4","",title+" · "+nodes.length));
  if(!nodes.length){shell.append(el("p","empty","No candidates in this category."));continue;}
  for(const n of nodes.slice(0,6))fact(shell,n.title,n.reasons.join(" · "),n.url,n.state.toUpperCase().replace(/_/g," "));
  if(nodes.length>6)shell.append(el("p","empty","Showing 6 of "+nodes.length+" nodes. Export the full graph to inspect all sources."));
 }
 shell.append(el("h4","","UNVERIFIED SEARCH OBSERVATIONS · "+(graph.observations||[]).length));
 if(!(graph.observations||[]).length)shell.append(el("p","empty","No matching indexed excerpts were captured."));
 for(const observation of (graph.observations||[]).slice(0,6))
  fact(shell,observation.title,observation.excerpt,observation.sourceUrl,
   "UNVERIFIED PERSON MATCH · SEARCH EXCERPT");
 shell.append(el("h4","","SOURCE-BACKED FACTS · "+graph.claims.length));
 if(!graph.claims.length)shell.append(el("p","empty","No direct source facts were extracted. Name-only snippets are not validated facts."));
 for(const c of graph.claims.slice(0,8))
  fact(shell,c.predicate.replace(/_/g," "),c.value,c.sourceUrl,"OBSERVED · NOT VERIFIED TRUE");
 shell.append(el("h4","","MONITORING SNAPSHOT"));
 if(!comparison)shell.append(el("p","empty","No comparison yet."));
 else if(comparison.baseline)shell.append(el("p","empty","Baseline saved locally. Rerun the audit to compare sources and facts."));
 else{
  shell.append(el("p","",comparison.reviewCount+" change signal(s) need review; they are not proof of record deletion or a correction."));
  if(comparison.coverageWarning)shell.append(el("p","warn",comparison.coverageWarning));
  for(const change of comparison.changes.slice(0,8))
   fact(shell,change.kind.replace(/_/g," "),change.message+
    (change.before?" Previous: "+change.before:"")+(change.after?" Current: "+change.after:""),change.url,change.status.replace(/_/g," "));
 }
 shell.append(el("h4","","REPAIR CANDIDATES · "+graph.repairs.length));
 if(!graph.repairs.length)shell.append(el("p","empty","No discrepancies supported by the current evidence."));
 for(const repair of graph.repairs.slice(0,7))
  fact(shell,repair.platform.toUpperCase()+" · "+repair.state.replace(/_/g," "),
   repair.currentStatement+" "+repair.proposedAction,repair.recordUrl,"NOT SUBMITTED · REVIEW REQUIRED");
 shell.append(el("p","warn","Read-only system graph. Identity confirmation, authorization and permitted platform integration are required before any external edit."));
 parent.append(shell);
}
