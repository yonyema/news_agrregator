let articles=[];
const $=s=>document.querySelector(s);
function esc(s=""){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function fmt(d){const x=new Date(d); if(isNaN(x)) return d||"時間未知"; return x.toLocaleString("zh-TW",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"});}
function render(){
  const q=$("#search").value.trim().toLowerCase(), src=$("#sourceFilter").value, order=$("#sort").value;
  let a=articles.filter(x=>(!src||x.source===src)&&(!q||[x.title,x.source,x.author,x.description].join(" ").toLowerCase().includes(q)));
  a.sort((x,y)=>{let dx=new Date(x.published||0)-new Date(y.published||0);return order==="newest"?-dx:dx});
  $("#count").textContent=a.length;
  $("#feed").innerHTML=a.map(x=>`<article class="item"><div class="meta"><span class="badge">${esc(x.source||"未知來源")}</span><span>${esc(x.author||"")}</span><span>·</span><time>${fmt(x.published)}</time></div><h2 class="title"><a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.title)}</a></h2>${x.description?`<p class="desc">${esc(x.description)}</p>`:""}</article>`).join("");
  $("#empty").hidden=a.length>0;
}
async function load(){
  $("#statusDot").style.background="#f0b429"; $("#updated").textContent="更新中…";
  try{
    const r=await fetch("articles.json?ts="+Date.now()); if(!r.ok) throw new Error();
    const data=await r.json(); articles=data.articles||[];
    const sources=[...new Set(articles.map(x=>x.source).filter(Boolean))].sort();
    $("#sourceFilter").innerHTML='<option value="">全部來源</option>'+sources.map(x=>`<option>${esc(x)}</option>`).join("");
    $("#sourceCount").textContent=sources.length;
    $("#updated").textContent="資料已載入"; $("#statusDot").style.background="#32c56d";
    $("#lastRun").textContent=data.generated_at?`最後更新：${new Date(data.generated_at).toLocaleString("zh-TW")}`:"";
    render();
  }catch(e){$("#updated").textContent="尚未有資料";$("#statusDot").style.background="#d64545";}
}
["input","change"].forEach(ev=>document.addEventListener(ev,e=>{if(["search","sourceFilter","sort"].includes(e.target.id))render()}));
$("#refresh").addEventListener("click",load); load();
