// Ulab operator-controlled repair execution plans.
// A plan is an audited, narrowly scoped website change. No arbitrary file or code edit input.
export const REPAIR_PLANS=Object.freeze({
 "about-identity-001":Object.freeze({
  id:"about-identity-001",
  subject:"Keenan Gray",
  title:"Make the About page identify its subject",
  repository:"thiskeenan-glitch/keenan-gray-site",
  baseBranch:"main",
  repairBranch:"ulab-first-website-repair",
  path:"app/about/page.tsx",
  targetUrl:"https://www.thiskeenan.com/about",
  verification:Object.freeze({platform:"website",field:"heading",expected:"Keenan Gray"}),
  description:"Replace the generic About-page heading and page metadata with the verified professional name. The owner reviews the resulting GitHub pull request before any live deployment.",
  changes:Object.freeze([
   Object.freeze({from:'  title: "Me | Brooklyn Film Director",',to:'  title: { absolute: "Keenan Gray | Film Director" },',count:1}),
   Object.freeze({from:'title: "Me | Keenan Gray",',to:'title: "Keenan Gray | Film Director",',count:2}),
   Object.freeze({from:'name: "Me | Keenan Gray",',to:'name: "Keenan Gray | Film Director",',count:1}),
   Object.freeze({from:"<h1>Me</h1>",to:"<h1>Keenan Gray</h1>",count:1})
  ])
 })
});
export function getPlan(id){
 if(typeof id!=="string"||!Object.hasOwn(REPAIR_PLANS,id))throw new Error("Unknown or unauthorized repair plan.");
 return REPAIR_PLANS[id];
}
const count=(haystack,needle)=>haystack.split(needle).length-1;
export function applyPlan(id,source){
 const plan=getPlan(id);
 if(typeof source!=="string"||source.length<100||source.length>250000)throw new Error("Unexpected source file size.");
 let code=source, changed=false;
 for(const change of plan.changes){
  const before=count(code,change.from),after=count(code,change.to);
  if(before===change.count&&after===0){code=code.replaceAll(change.from,change.to);changed=true;continue;}
  if(before===0&&after===change.count)continue;
  throw new Error("Source file differs from the verified repair plan; needs manual review.");
 }
 return {changed,content:code,plan};
}
export function publicPlan(id){
 const plan=getPlan(id);
 return {id:plan.id,subject:plan.subject,title:plan.title,description:plan.description,
  site:plan.targetUrl,verification:plan.verification,changes:plan.changes.map(({from,to})=>({from:from.trim(),to:to.trim()})),
  nextStep:"GitHub draft pull request, then owner review. Nothing is automatically published."};
}
