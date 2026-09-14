let articles=[], favorites=JSON.parse(localStorage.getItem("newsFavorites")||"[]"), view="home", topic="";
const $=s=>document.querySelector(s);
const esc=s=>String(s||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function datefmt(d){let x=new Date(d);return isNaN(x)?"時間未知":x.toLocaleString("zh-TW",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"});}
function topicOf(x){let t=(x.title+" "+(x.description||"")).toLowerCase(); if(/股|財|經|金管|銀行|市場|投資|台積|企業/.test(t))return"財經";if(/AI|科技|半導體|手機|軟體|網路|晶片/.test(t))return"科技";if(/警|檢|法院|犯罪|事故|火災|死|傷/.test(t))return"社會";if(/台北|新北|桃園|台中|台南|高雄|地方|縣|市政府/.test(t))return"地方";return"政治";}
function saveFav(){localStorage.setItem("newsFavorites",JSON.stringify(favorites));$("#favCount").textContent=favorites.length}
function isRecent(x){let d=new Date(x.published).getTime();return Number.isFinite(d)&&d>=Date.now()-3600000&&d<=Date.now()+300000;}
function renderLive(){
 let arr=articles.filter(isRecent).sort((a,b)=>new Date(b.published)-new Date(a.published)).slice(0,20);
 $("#liveCount").textContent=arr.length+" 篇";
 $("#liveWindow").textContent=""+new Date(Date.now()-3600000).toLocaleTimeString("zh-TW",{hour:"2-digit",minute:"2-digit"})+"–"+new Date().toLocaleTimeString("zh-TW",{hour:"2-digit",minute:"2-digit"})+"";
 $("#liveFeed").innerHTML=arr.map(x=>`<a class="live-item" href="${esc(x.url)}" target="_blank" rel="noopener"><span class="live-time">${datefmt(x.published)}</span><span class="live-source">${esc(x.source)}</span><span class="live-title">${esc(x.title)}</span></a>`).join("");
 $("#liveEmpty").hidden=arr.length>0;
}
function render(){
 let q=$("#search").value.trim().toLowerCase(), src=$("#sourceFilter").value, arr=articles.filter(x=>(!src||x.source===src)&&(!q||[x.title,x.source,x.author,x.description].join(" ").toLowerCase().includes(q))&&(!topic||topicOf(x)===topic));
 if(view==="favorites")arr=arr.filter(x=>favorites.includes(x.url));
 arr.sort((a,b)=>{let d=new Date(a.published||0)-new Date(b.published||0);return $("#sort").value==="newest"?-d:d});
 $("#sectionTitle").textContent=view==="favorites"?"我的收藏":topic?topic+"新聞":"最新文章";$("#resultCount").textContent=arr.length+" 篇";
 $("#feed").innerHTML=arr.map(x=>`<article class="item"><div><div class="meta"><span class="badge">${esc(x.source)}</span>${esc(x.author||"")}　·　${datefmt(x.published)}</div><h3 class="title"><a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.title)}</a></h3>${x.description?`<p class="desc">${esc(x.description)}</p>`:""}</div><button class="star ${favorites.includes(x.url)?"on":""}" data-url="${esc(x.url)}">${favorites.includes(x.url)?"★":"☆"}</button></article>`).join("");
 $("#empty").hidden=arr.length>0; saveFav();
}
function renderTopics(){let c={};articles.forEach(x=>c[topicOf(x)]=(c[topicOf(x)]||0)+1);$("#topicSummary").innerHTML=Object.entries(c).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<button class="topic-card" data-topic="${k}"><strong>${v}</strong><span>${k}</span></button>`).join("")}
async function load(){try{let r=await fetch("articles.json?ts="+Date.now());let d=await r.json();articles=d.articles||[];let sources=[...new Set(articles.map(x=>x.source).filter(Boolean))].sort();$("#sourceFilter").innerHTML='<option value="">全部媒體</option>'+sources.map(x=>`<option>${esc(x)}</option>`).join("");$("#total").textContent=articles.length;$("#media").textContent=sources.length;let day=Date.now()-86400000;$("#hours").textContent=articles.filter(x=>new Date(x.published)>day).length;$("#lastUpdated").textContent=d.generated_at?new Date(d.generated_at).toLocaleString("zh-TW"):"資料尚未更新";renderTopics();renderLive();render()}catch(e){$("#lastUpdated").textContent="讀取失敗，請稍後重試"}}
document.addEventListener("click",e=>{let n=e.target.closest(".nav");if(n){document.querySelectorAll(".nav").forEach(x=>x.classList.remove("active"));n.classList.add("active");view=n.dataset.view;topic="";render()}let t=e.target.closest("[data-topic]");if(t){topic=t.dataset.topic;view="home";render()}let s=e.target.closest(".star");if(s){let u=s.dataset.url;favorites=favorites.includes(u)?favorites.filter(x=>x!==u):[...favorites,u];render()}});
["input","change"].forEach(ev=>document.addEventListener(ev,e=>{if(["search","sourceFilter","sort"].includes(e.target.id))render()}));
$("#refresh").onclick=load;function tick(){$("#clock").textContent=new Date().toLocaleString("zh-TW",{month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit"})};tick();setInterval(tick,1000);setInterval(renderLive,60000);load();setInterval(load,3600000);
$("#date").textContent=new Date().toLocaleDateString("zh-TW",{year:"numeric",month:"long",day:"numeric",weekday:"long"});
