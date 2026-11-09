// Static regression test for cinematic presentation.
import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
const root=new URL(".",import.meta.url);
const read=path=>readFileSync(new URL(path,root),"utf8");
const html=read("public/index.html");
const app=read("public/app.js");
const animation=read("public/cinematic.js");
const styles=read("public/cinematic.css");
const vercel=JSON.parse(read("vercel.json"));
test("cinematic homepage retains the real Ulab audit and correction workflow",()=>{
 for(const id of [
  "home-screen","home-logo","identity-form","person-name","site-url","run-button","form-message",
  "search-screen","search-heading","search-subject","search-message","cancel-scan",
  "report-screen","report-person","connection-score","report-date","tab-content","fix-button",
  "fix-dialog","correction-form","new-scan","download-report"
 ])assert.ok(html.includes('id="'+id+'"'),"Missing required working UI element "+id);
 assert.match(app,/form\.addEventListener\("submit"/);
 assert.match(app,/fetch\("\/api\/discover"/);
 assert.match(app,/CustomEvent\("ulab:report-ready"/);
 assert.match(app,/\$\("report-person"\)\.textContent=/);
 const used=[...app.matchAll(/\$\("([a-z][\w-]+)"\)/g)].map(m=>m[1]);
 for(const id of new Set(used))assert.ok(html.includes('id="'+id+'"'),"App references nonexistent element "+id);
});
test("animations depict an illustrative knowledge graph, never fake live results",()=>{
 assert.match(html,/id="identity-universe"/);
 assert.match(html,/THE PERSON BEHIND THE NAME/);
 assert.match(html,/NOT ACTUAL SEARCH RESULTS/);
 assert.match(html,/NOT ACTUAL SEARCH RESULTS/);
 assert.match(html,/NO GUARANTEED KNOWLEDGE PANEL/);
 assert.ok(!html.includes("Verified knowledge panel created"));
 assert.match(animation,/visualName\.textContent=/);
 assert.match(animation,/prefers-reduced-motion/);
 assert.match(animation,/IntersectionObserver/);
 assert.match(styles,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(styles,/@media\(max-width:620px\)/);
 assert.match(styles,/@media\(max-width:370px\)/);
});
test("all new visual assets are linked and served by the Vercel static routes",()=>{
 for(const asset of ["cinematic.css","cinematic.js"]){
  assert.ok(html.includes('"/'+asset+'"'));
  assert.ok(vercel.routes.some(r=>r.dest==="/public/$1"&&r.src.includes(asset.replace(".","\\."))),"Missing static rewrite "+asset);
 }
 assert.ok(vercel.routes.some(r=>r.src==="^/$"&&r.dest==="/public/index.html"));
 assert.ok(vercel.routes.some(r=>r.src==="^/api/discover/?$"&&r.dest==="/api/discover.js"));
 assert.match(html,/data-tab="fixes"/);
 assert.match(html,/id="bottom-start"/);
 assert.match(animation,/bottom-start/);
});
