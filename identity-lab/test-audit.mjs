import assert from "node:assert/strict";
import test from "node:test";
import handler from "./api/audit.js";

const originalFetch = global.fetch;
const input = {
  name: "Keenan Gray",
  website: "https://www.thiskeenan.com",
  imdb: "https://www.imdb.com/name/nm16096261/"
};
const html = `<!doctype html><html><head>
<title>Keenan Gray | Brooklyn Film Director</title>
<meta name="description" content="Keenan Gray is a Brooklyn film director.">
<link rel="canonical" href="https://www.thiskeenan.com/">
<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Person","name":"Keenan Gray","sameAs":["https://www.imdb.com/name/nm16096261/"]}]}</script>
</head><body><a href="https://www.imdb.com/name/nm16096261/">IMDb</a></body></html>`;

function response(resBody, status=200, headers={}) {
  return new Response(resBody, {status, headers});
}
function mockPages(url) {
  if (url.endsWith("/about")) return response("<html><h1>Me</h1></html>");
  if (url.endsWith("/robots.txt")) return response("User-agent: *\nAllow: /");
  if (url.endsWith("/sitemap.xml")) return response("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\"></urlset>");
  return response(html);
}
async function run(body,method="POST") {
  const res = {
    statusCode: 0, result:null,
    setHeader() {},
    status(code) {this.statusCode=code;return this;},
    json(data) {this.result=data;return this;}
  };
  await handler({method,body,headers:{}},res);
  return res;
}

test("correctly finds existing IMDb structured and visible connections", async()=>{
  global.fetch=async (url)=>mockPages(url);
  try {
    const out=await run(input);
    assert.equal(out.statusCode,200);
    assert.equal(out.result.results.find(f=>f.id==="sameas").status,"pass");
    assert.equal(out.result.results.find(f=>f.id==="visible").status,"pass");
    assert.equal(out.result.results.find(f=>f.id==="heading").status,"action");
    assert.equal(out.result.results.find(f=>f.id==="panel").status,"manual");
    assert.equal(out.result.aiSummary,null);
  } finally {global.fetch=originalFetch;}
});

test("rejects other domains before any network request",async()=>{
  let networkCalls=0;
  global.fetch=async()=>{networkCalls++;return response("");};
  try {
    const out=await run({...input,website:"https://example.org"});
    assert.equal(out.statusCode,400);
    assert.equal(networkCalls,0);
  } finally {global.fetch=originalFetch;}
});

test("rejects unsafe IMDb URL",async()=>{
  global.fetch=async()=>{throw new Error("Must not fetch");};
  try {
    const out=await run({...input,imdb:"http://imdb.com/name/nm16096261/"});
    assert.equal(out.statusCode,400);
  } finally {global.fetch=originalFetch;}
});

test("does not follow redirects outside allowlisted host",async()=>{
  const requested=[];
  global.fetch=async (url)=>{
    requested.push(url);
    if (url.endsWith("/")) return response(null,302,{Location:"http://169.254.169.254/latest/meta-data"});
    return mockPages(url);
  };
  try {
    const out=await run(input);
    assert.equal(out.statusCode,200);
    assert.equal(out.result.results.find(f=>f.id==="reach").status,"unknown");
    assert.equal(requested.length,4);
    assert.ok(requested.every(u=>u.startsWith("https://www.thiskeenan.com/")));
  } finally {global.fetch=originalFetch;}
});
