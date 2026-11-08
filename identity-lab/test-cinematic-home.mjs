// Static regression checks for the minimal public Ulab customer preview.
import assert from "node:assert/strict";
import test from "node:test";
import {readFileSync} from "node:fs";
const root=new URL(".",import.meta.url);
const read=path=>readFileSync(new URL(path,root),"utf8");
const html=read("public/index.html"),app=read("public/app.js"),styles=read("public/cinematic.css");
const proof=read("public/proof-ui.js"),repair=read("public/repair-ui.js");
const vercel=JSON.parse(read("vercel.json"));
test("visitors can audit and prepare a correction with no account or payment",()=>{
 for(const id of ["home-screen","home-logo","identity-form","person-name","site-url","run-button","form-message",
 "search-screen","search-heading","search-subject","search-message","cancel-scan","report-screen","report-person",
 "connection-score","report-date","tab-content","fix-button","fix-dialog","correction-form","new-scan","download-report",
 "proof-panel","proof-form","proof-details","coverage-status","coverage-note","count-fixes",
 "count-profiles","count-coverage","count-knowledge"])
 assert.ok(html.includes('id="'+id+'"'),"Missing required element "+id);
 const used=[...app.matchAll(/\$\("([a-z][\w-]+)"\)/g),...proof.matchAll(/\$\("([a-z][\w-]+)"\)/g),...repair.matchAll(/\$\("([a-z][\w-]+)"\)/g)].map(x=>x[1]);
 for(const id of new Set(used))assert.ok(html.includes('id="'+id+'"'),"JS references nonexistent element "+id);
 assert.match(app,/fetch\("\/api\/discover"/);
 assert.match(proof,/fetch\("\/api\/verify-repair"/);
 assert.match(app,/CustomEvent\("ulab:report-ready"/);
 assert.match(app,/makePacket/);
 assert.match(html,/No account or payment needed/);
 assert.doesNotMatch(html,/stripe\.com|checkout\.stripe|\bPay now\b|\bSubscribe\b/i);
});
test("homepage is minimal and uses the black and deep red palette",()=>{
 assert.match(html,/Be known/);
 for(const id of ["overview","sources","fixes"])assert.match(html,new RegExp('data-tab="'+id+'"'));
 assert.equal([...html.matchAll(/data-tab="/g)].length,3);
 assert.match(styles,/#080809/);
 assert.match(styles,/#a70e23/);
 assert.match(styles,/\.hero-art/);
 assert.match(styles,/@media\(max-width:720px\)/);
 assert.match(styles, /prefers-reduced-motion/);
 assert.ok(!html.includes("—")&&!app.includes("—")&&!styles.includes("—"),"No em dashes in customer-facing page code");
 assert.ok(!html.includes("cinematic.js"),"No unnecessary old motion script loaded");
});
test("live audit and proof URLs resolve through configured Vercel routes",()=>{
 for(const asset of ["style.css","cinematic.css","app.js","proof-ui.js","repair-ui.js","identity-engine.mjs"]){
  assert.ok(vercel.routes.some(r=>r.dest==="/public/$1"&&r.src.includes(asset.replace(".","\\."))),"Missing static rewrite "+asset);
 }
 for(const [src,dest] of [["^/$","/public/index.html"],["^/api/discover/?$","/api/discover.js"],["^/api/verify-repair/?$","/api/verify-repair.js"]])
  assert.ok(vercel.routes.some(r=>r.src===src&&r.dest===dest),"Missing route "+src);
});
