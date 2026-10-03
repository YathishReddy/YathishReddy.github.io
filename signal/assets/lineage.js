/* Signal Weekly: "Where these ideas come from" (shared by every issue).
   Usage, after LINEAGE/CARDS/COLS are defined:
     SignalLineage.render({lineage:LINEAGE, cards:CARDS, cols:COLS});
   Markup needed: <section class="lineage" id="lineage"></section>
   Each LINEAGE entry may set `group` to one of the THEMES ids; otherwise the id map below is used. */
(function(){
const THEMES=[
 {id:"agents",name:"Agents & tool use",ids:["react","toolformer","autogen","voyager","memgpt","rlm","rag"]},
 {id:"training",name:"Training & fine-tuning",ids:["rlvr","distill","dagger","cot","textbooks","verl","lora","reg"]},
 {id:"arch",name:"Model design",ids:["moe","mobilellm","attnonly","looped","gdn","mtp","bpe"]},
 {id:"gen",name:"Vision, video & speech",ids:["diffusion","wan","sam3","whisper","vae"]},
 {id:"serving",name:"Serving & caching",ids:["distserve","pagedattn","radixattn","cacheblend","spec","eagle"]},
 {id:"compress",name:"Compression & hardware",ids:["quant","mx","dsv3fp8","zero","tilelang","bitnet","simd"]},
 {id:"eval",name:"Benchmarks",ids:["ruler","osworld"]},
 {id:"other",name:"Other ideas",ids:[]}
];
const esc=s=>String(s).replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
const themeOf=l=>l.group||(THEMES.find(t=>t.ids.includes(l.id))||{id:"other"}).id;
const yearOf=l=>{const m=String(l.src).match(/\b(19|20)\d\d\b/);return m?m[0]:"";};

function render({lineage,cards,cols}){
  const host=document.getElementById("lineage"); if(!host) return;
  const byId=Object.fromEntries(cards.map(c=>[c.id,c]));
  const colById=Object.fromEntries(cols.map(c=>[c.id,c]));
  const pickName=id=>esc((byId[id]?byId[id].title:id).split(":")[0]);
  const colVar=id=>byId[id]&&colById[byId[id].col]?colById[byId[id].col].c:"--muted";
  const items=lineage.map(l=>({...l,theme:themeOf(l),year:yearOf(l),
    hay:[l.title,l.src,l.idea,...l.used.map(([c,t])=>(byId[c]?byId[c].title:"")+" "+t)].join(" ").toLowerCase()}));
  const themes=THEMES.filter(t=>items.some(i=>i.theme===t.id));
  const picks=new Set(items.flatMap(i=>i.used.map(u=>u[0]))).size;
  const top=[...items].sort((a,b)=>b.used.length-a.used.length).filter(i=>i.used.length>1).slice(0,3);

  host.innerHTML=`
  <details class="lin-wrap" id="lin-wrap">
   <summary>
    <div><span class="lin-eyebrow">Background reading</span>
     <h2>Where these ideas come from</h2>
     <p class="lin-sub">${items.length} earlier ideas behind ${picks} of this week's picks, grouped into ${themes.length} themes.${top.length?` Most used: ${top.map(t=>esc(t.title.split(":")[0])).join(", ")}.`:""}</p></div>
    <span class="lin-toggle" aria-hidden="true"></span>
   </summary>
   <div class="lin-body">
    <p class="lin-note">Tap an idea to see what it is, where it first appeared and which picks use it. <span class="cite-kind k-cited">cited</span> means the new work names the source directly; <span class="cite-kind">background</span> means it is the standard origin of the technique.</p>
    <div class="lin-tools">
     <input class="lin-search" id="lin-q" type="search" placeholder="Search ideas, papers or picks" aria-label="Search ideas">
     <div class="lin-seg" role="group" aria-label="Source type">
      <button type="button" data-k="all" aria-pressed="true">All</button><button type="button" data-k="cited" aria-pressed="false">Cited</button><button type="button" data-k="background" aria-pressed="false">Background</button>
     </div>
     <button type="button" class="lin-expand" id="lin-expand">Expand all</button>
    </div>
    <div class="lin-chips" id="lin-chips" role="group" aria-label="Themes">
     ${[{id:"all",name:"All themes"},...themes].map(t=>`<button type="button" class="chip" data-t="${t.id}" aria-pressed="${t.id==="all"}">${esc(t.name)} <b>${t.id==="all"?items.length:items.filter(i=>i.theme===t.id).length}</b></button>`).join("")}
    </div>
    <div id="lin-groups">${themes.map(t=>{
      const its=items.filter(i=>i.theme===t.id).sort((a,b)=>b.used.length-a.used.length||a.title.localeCompare(b.title));
      return `<div class="lin-group" data-g="${t.id}"><h3>${esc(t.name)} <span>· ${its.length}</span></h3><div class="lin-list">${its.map(l=>`
       <details class="lin" id="lin-${l.id}" data-kind="${l.kind}">
        <summary>
         <span class="lin-t">${esc(l.title)}</span>
         <span class="lin-m">${l.year?`<span>${l.year}</span>`:""}<span class="cite-kind${l.kind==="cited"?" k-cited":""}">${esc(l.kind)}</span><span class="lin-dots" title="${l.used.length} pick${l.used.length>1?"s":""} this week">${l.used.map(([c])=>`<i style="--c:var(${colVar(c)})"></i>`).join("")}</span><span>${l.used.length} pick${l.used.length>1?"s":""}</span></span>
        </summary>
        <div class="lin-d">
         <p class="src"><a href="${l.url}" target="_blank" rel="noopener">${esc(l.src)} ↗</a></p>
         <p>${esc(l.idea)}</p>
         <h4>Used this week</h4>
         <ul class="lin-used">${l.used.map(([c,t])=>`<li style="--c:var(${colVar(c)})"><a href="#${c}" data-open="${c}">${pickName(c)}</a>: ${esc(t)}</li>`).join("")}</ul>
        </div>
       </details>`).join("")}</div></div>`;}).join("")}</div>
    <p class="lin-empty" id="lin-empty" hidden>No ideas match. Try a different word or clear the filters.</p>
   </div>
  </details>`;

  const wrap=host.querySelector("#lin-wrap"), q=host.querySelector("#lin-q"), empty=host.querySelector("#lin-empty"), exp=host.querySelector("#lin-expand");
  let theme="all", kind="all";
  const entries=[...host.querySelectorAll(".lin")];
  function apply(){
    const s=q.value.trim().toLowerCase(); let n=0;
    entries.forEach(el=>{const it=items.find(i=>"lin-"+i.id===el.id);
      const ok=(theme==="all"||it.theme===theme)&&(kind==="all"||it.kind===kind)&&(!s||it.hay.includes(s));
      el.hidden=!ok; if(ok) n++; if(s&&ok) el.open=true;});
    host.querySelectorAll(".lin-group").forEach(g=>{g.hidden=!g.querySelector(".lin:not([hidden])");});
    empty.hidden=n>0;
  }
  function press(sel,attr,val){host.querySelectorAll(sel).forEach(b=>b.setAttribute("aria-pressed",String(b.dataset[attr]===val)));}
  host.querySelector("#lin-chips").addEventListener("click",e=>{const b=e.target.closest("[data-t]");if(!b)return;theme=b.dataset.t;press("[data-t]","t",theme);apply();});
  host.querySelector(".lin-seg").addEventListener("click",e=>{const b=e.target.closest("[data-k]");if(!b)return;kind=b.dataset.k;press("[data-k]","k",kind);apply();});
  q.addEventListener("input",apply);
  exp.addEventListener("click",()=>{const open=exp.textContent==="Expand all";entries.forEach(el=>{if(!el.hidden)el.open=open;});exp.textContent=open?"Collapse all":"Expand all";});

  function reveal(id){
    const el=document.getElementById("lin-"+id); if(!el) return;
    wrap.open=true; theme="all"; kind="all"; q.value=""; press("[data-t]","t","all"); press("[data-k]","k","all"); apply();
    el.open=true; el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash");
    requestAnimationFrame(()=>el.scrollIntoView({behavior:"smooth",block:"start"}));
  }
  document.addEventListener("click",e=>{const a=e.target.closest("[data-lin]");if(!a)return;e.preventDefault();history.replaceState(null,"","#lin-"+a.dataset.lin);setTimeout(()=>reveal(a.dataset.lin),0);});
  const fromHash=()=>{const h=location.hash; if(h==="#lineage") wrap.open=true; else if(h.startsWith("#lin-")) reveal(h.slice(5));};
  window.addEventListener("hashchange",fromHash); fromHash();
}
window.SignalLineage={render,THEMES};
})();
