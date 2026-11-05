(() => {
  const form=document.getElementById("audit-form");
  const submit=document.getElementById("run-button");
  const buttonLabel=document.getElementById("button-label");
  const message=document.getElementById("form-message");
  const section=document.getElementById("results");
  const findingsList=document.getElementById("findings-list");
  const priorityList=document.getElementById("priority-list");
  const aiNote=document.getElementById("ai-note");
  const aiText=document.getElementById("ai-text");
  const copyButton=document.getElementById("copy-report");
  const downloadButton=document.getElementById("download-report");
  let currentReport=null;
  const statusLabels={pass:"CONFIRMED",action:"ACTION",manual:"MANUAL",unknown:"UNKNOWN"};
  const statusMarks={pass:"✓",action:"!",manual:"↗",unknown:"?"};

  function node(tag,className,text) {
    const el=document.createElement(tag);
    if(className) el.className=className;
    if(text!==undefined && text!==null) el.textContent=String(text);
    return el;
  }
  function safeLink(url,label) {
    if(!url) return null;
    try {
      const parsed=new URL(url);
      if(parsed.protocol!=="https:" && parsed.protocol!=="http:") return null;
      const a=node("a","finding-source",label||"VIEW SOURCE ↗");
      a.href=parsed.href;a.target="_blank";a.rel="noopener noreferrer";
      return a;
    } catch {return null;}
  }
  function finding(item) {
    const outer=node("div","finding");
    const marker=node("span","finding-marker "+item.status,statusMarks[item.status]||"?");
    marker.setAttribute("aria-hidden","true");
    const content=node("div","finding-body");
    const top=node("div","finding-top");
    top.append(node("strong","finding-title",item.title));
    top.append(node("span","finding-pill "+item.status,statusLabels[item.status]||"CHECK"));
    content.append(top,node("p","finding-detail",item.detail));
    const link=safeLink(item.url);
    if(link) content.append(link);
    outer.append(marker,content);
    return outer;
  }
  function render(report) {
    currentReport=report;
    section.hidden=false;
    document.getElementById("report-subtitle").textContent=report.subject.name+" · "+report.subject.website+" · Source-backed public-page checks";
    document.getElementById("check-count").textContent=String(report.results.length);
    document.getElementById("pass-count").textContent=String(report.summary.pass);
    document.getElementById("action-count").textContent=String(report.summary.action);
    document.getElementById("manual-count").textContent=String(report.summary.manual+report.summary.unknown);
    document.getElementById("findings-total").textContent=String(report.results.length)+" FINDINGS";
    document.getElementById("report-date").textContent="SCAN GENERATED "+new Date(report.generatedAt).toLocaleString(undefined,{dateStyle:"medium",timeStyle:"short"}).toUpperCase();
    findingsList.replaceChildren(...report.results.map(finding));
    const priorities=report.priority||[];
    priorityList.replaceChildren();
    if(!priorities.length) {
      priorityList.append(node("p","empty-note","No obvious repair opportunities were found in the pages we could inspect. Review the manual verification items next."));
    } else {
      priorities.forEach(item=>{
        const li=node("li");
        const inner=node("div");
        inner.append(node("strong","",item.title),node("p","",item.description));
        const link=safeLink(item.source,"SEE EVIDENCE ↗");
        if(link) inner.append(link);
        li.append(inner);
        priorityList.append(li);
      });
    }
    aiNote.hidden=!report.aiSummary;
    aiText.textContent=report.aiSummary||"";
    section.scrollIntoView({behavior:"smooth",block:"start"});
  }
  form.addEventListener("submit",async event=>{
    event.preventDefault();
    const data={
      name:document.getElementById("person-name").value.trim(),
      website:document.getElementById("site-url").value.trim(),
      imdb:document.getElementById("imdb-url").value.trim()
    };
    const key=document.getElementById("access-code").value.trim();
    message.classList.remove("error");
    if(!data.name||!data.website){message.textContent="Please enter your name and website.";return;}
    submit.disabled=true;buttonLabel.textContent="SCANNING PUBLIC PAGES…";
    message.textContent="Checking the homepage, About page, robots.txt and sitemap.xml. No changes will be made.";
    try {
      const controller=new AbortController();
      const timeout=setTimeout(()=>controller.abort(),35000);
      let response;
      try {
        response=await fetch("/api/audit",{
          method:"POST",
          headers:{"Content-Type":"application/json",...(key?{"X-Audit-Key":key}:{})},
          body:JSON.stringify(data),
          signal:controller.signal
        });
      } finally {clearTimeout(timeout);}
      const report=await response.json();
      if(!response.ok) throw new Error(report.error||"Audit request failed.");
      render(report);
      message.textContent="Audit complete. "+report.summary.pass+" confirmed, "+report.summary.action+" actionable, "+(report.summary.manual+report.summary.unknown)+" requiring other evidence.";
    } catch(error) {
      message.classList.add("error");
      message.textContent=error.name==="AbortError"?"The audit timed out. Please retry.":String(error.message||"The audit could not be completed.");
    } finally {
      submit.disabled=false;buttonLabel.textContent="START AUDIT";
    }
  });
  copyButton.addEventListener("click",async()=>{
    if(!currentReport) return;
    const report=currentReport;
    const lines=[
      "IDENTITY LAB AUDIT — "+report.subject.name,
      "Website: "+report.subject.website,
      "Date: "+report.generatedAt,
      "",
      "ACTIONABLE:",
      ...(report.priority.length?report.priority.map((x,i)=>(i+1)+". "+x.title+" — "+x.description):["No obvious repair tasks in sampled pages."]),
      "",
      "REQUIRES VERIFICATION:",
      ...report.results.filter(x=>x.status==="manual"||x.status==="unknown").map(x=>"- "+x.title+": "+x.detail),
      "",
      report.disclaimer
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      copyButton.textContent="COPIED ✓";
    } catch {
      const text=node("textarea");text.value=lines.join("\n");
      text.style.position="fixed";text.style.opacity="0";document.body.append(text);text.select();
      const ok=document.execCommand("copy");text.remove();
      copyButton.textContent=ok?"COPIED ✓":"COPY UNAVAILABLE";
    }
    setTimeout(()=>copyButton.textContent="COPY ACTIONS ↗",1800);
  });
  downloadButton.addEventListener("click",()=>{
    if(!currentReport) return;
    const blob=new Blob([JSON.stringify(currentReport,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=node("a");
    a.href=url;a.download="identity-lab-keenan-audit.json";
    document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),5000);
  });
})();
