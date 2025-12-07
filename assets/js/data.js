import { todayISO, TODAY } from './utils.js';

function isoToBG_YY(iso){ if(!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return ""; var y=iso.slice(0,4), m=iso.slice(5,7), d=iso.slice(8,10); return d+"."+m+"."+y.slice(2); }
function bgToISO_any(bg){
  var m2=bg.match(/^(\d{2})\.(\d{2})\.(\d{2})$/); if(m2) return "20"+m2[3]+"-"+m2[2]+"-"+m2[1];
  var m4=bg.match(/^(\d{2})\.(\d{2})\.(\d{4})$/); if(m4) return m4[3]+"-"+m4[2]+"-"+m4[1];
  return "";
}
var KEY="bt-progress";
function load(){ try{ return JSON.parse(localStorage.getItem(KEY)||"[]"); }catch(_) { return []; } }
function save(a){ localStorage.setItem(KEY, JSON.stringify(a)); }
function sortDesc(a){ return a.slice().sort((x,y)=>y.date.localeCompare(x.date)); }
function sortAsc(a){ return a.slice().sort((x,y)=>x.date.localeCompare(y.date)); }

var dateText=document.getElementById("dateText"), calEl=document.getElementById("cal"),
    weight=document.getElementById("weight"), addBtn=document.getElementById("addBtn"),
    tb=document.querySelector("#tbl tbody"), pagerTop=document.getElementById("pagerTop"),
    pagerBottom=document.getElementById("pagerBottom"), aggSel=document.getElementById("aggSel"),
    chart=document.getElementById("chart"), pageSizeSel=document.getElementById("pageSize"),
    exportBtn=document.getElementById("exportBtn"), importBtn=document.getElementById("importBtn"),
    importFile=document.getElementById("importFile"), btFlag=document.getElementById("btFlag");

var currentISO=localStorage.getItem("bt-last-date")||TODAY;
if(!/^\d{4}-\d{2}-\d{2}$/.test(currentISO)) currentISO=TODAY;
dateText.value=isoToBG_YY(currentISO);

function prefillFor(iso){
  var data=load(); var rec=data.find(r=>r.date===iso);
  if(rec){
    weight.value=(typeof rec.weight==="number")?rec.weight:"";
    btFlag.checked = (rec.bt!==false);
    return;
  }
  var prev=sortDesc(data).find(r=>r.date<iso);
  weight.value=prev?prev.weight:"";
  btFlag.checked=true;
}
prefillFor(currentISO);

var calYear=+currentISO.slice(0,4), calMonth=+currentISO.slice(5,7);
function ymd(y,m,d){ return String(y).padStart(4,"0")+"-"+String(m).padStart(2,"0")+"-"+String(d).padStart(2,"0"); }

function hasDataSet(){ var s=new Set(); load().forEach(r=>s.add(r.date)); return s; }

function renderCalendar(){
  var set=hasDataSet(), y=calYear, m=calMonth;
  var first=new Date(Date.UTC(y,m-1,1));
  var startDow=(first.getUTCDay()+6)%7;
  var daysInMonth=new Date(Date.UTC(y,m,0)).getUTCDate();
  var title=new Date(Date.UTC(y,m-1,1)).toLocaleDateString("bg-BG",{year:"numeric",month:"long"});
  var html='<div class="cal-head"><button id="calPrev" type="button">←</button><div class="cal-title">'+title+'</div><button id="calNext" type="button">→</button></div>';
  html+='<div class="cal-grid">';
  ["Пн","Вт","Ср","Чт","Пт","Сб","Нд"].forEach(x=>html+='<div class="dow">'+x+'</div>');
  for(var i=0;i<startDow;i++) html+='<div class="day disabled"></div>';
  for(var d=1; d<=daysInMonth; d++){
    var iso=ymd(y,m,d), future=(iso>TODAY);
    var cls=["day"]; if(iso===currentISO) cls.push("sel"); if(iso===TODAY) cls.push("today");
    if(set.has(iso)) cls.push("has"); if(future) cls.push("disabled");
    html+='<button type="button" class="'+cls.join(" ")+'" data-iso="'+iso+'">'+d+'</button>';
  }
  html+='</div>';
  calEl.innerHTML=html;
}
function showCalendar(){ renderCalendar(); calEl.classList.add("show"); }
function hideCalendar(){ calEl.classList.remove("show"); }

dateText.addEventListener("click",(e)=>{
  e.stopPropagation();
  calYear=+currentISO.slice(0,4); calMonth=+currentISO.slice(5,7);
  showCalendar();
});
calEl.addEventListener("click",(e)=>{
  e.stopPropagation(); var t=e.target;
  if(t && t.id==="calPrev"){ calMonth--; if(calMonth===0){calMonth=12; calYear--; } renderCalendar(); return; }
  if(t && t.id==="calNext"){ calMonth++; if(calMonth===13){calMonth=1; calYear++; } renderCalendar(); return; }
  var btn=t.closest && t.closest(".day[data-iso]");
  if(btn){
    var iso=btn.getAttribute("data-iso");
    if(iso<=TODAY){
      currentISO=iso;
      localStorage.setItem("bt-last-date",iso);
      dateText.value=isoToBG_YY(iso);
      prefillFor(iso);
      hideCalendar();
    }
  }
});
document.addEventListener("click",(e)=>{ if(!calEl.contains(e.target) && e.target!==dateText) hideCalendar(); });

addBtn.addEventListener("click", ()=>{
  var iso=currentISO;
  if(iso>TODAY){ alert("Датата е в бъдещето."); return; }
  var w=Number(weight.value); if(!(w>0)){ alert("Въведи тегло > 0."); return; }

  var data=load(), prev=sortDesc(data).find(r=>r.date<iso), next=sortAsc(data).find(r=>r.date>iso);
  var ok=true, msgs=[];
  if(prev){
    var minP=prev.weight*0.95, maxP=prev.weight*1.05;
    if(w<minP||w>maxP){ ok=false; msgs.push("спрямо "+isoToBG_YY(prev.date)+": "+minP.toFixed(1)+"–"+maxP.toFixed(1)+" kg"); }
  }
  if(next){
    var minN=next.weight*0.95, maxN=next.weight*1.05;
    if(w<minN||w>maxN){ ok=false; msgs.push("спрямо "+isoToBG_YY(next.date)+": "+minN.toFixed(1)+"–"+maxN.toFixed(1)+" kg"); }
  }
  if(!ok){ alert("Извън допустимите граници:\n"+msgs.join("\n")); return; }

  var idx=data.findIndex(r=>r.date===iso);
  var rec={date: iso, weight: w, bt: !!btFlag.checked};
  if(idx>=0) data[idx]=rec; else data.push(rec);
  save(data);
  renderTable(); renderChart();
});

var PAGE_SIZES=[7,14,28,84,112,168,336,"all"];
function getPS(){ var v=localStorage.getItem("bt-page-size"); if(v==="all") return "all"; var n=Number(v); return (PAGE_SIZES.indexOf(n)>=0)?n:28; }
function setPS(v){ localStorage.setItem("bt-page-size",v); }
var pageSize=getPS(), currentPage=1;
(function(){ var v=(pageSize==="all")?"all":String(pageSize); var opt=document.querySelector('#pageSize option[value="'+v+'"]'); if(opt) pageSizeSel.value=v; })();
pageSizeSel.addEventListener("change", ()=>{
  var v=pageSizeSel.value;
  pageSize=(v==="all")?"all":Number(v);
  setPS(v);
  currentPage=1;
  renderTable(); renderChart();
});

var __currentSlice=[];

function buildPager(container,total,eff){
  container.innerHTML="";
  var start=(currentPage-1)*eff, from=total?start+1:0, to=Math.min(start+eff,total);
  var info=document.createElement("span"); info.className="info"; info.textContent=from+"-"+to+" от "+total; container.appendChild(info);

  var pagesTotal=Math.max(1,Math.ceil(total/eff)), frag=document.createDocumentFragment();
  function pageBtn(n,active){
    var b=document.createElement("button");
    b.textContent=String(n);
    if(active) b.className="active";
    b.addEventListener("click",()=>{currentPage=n; renderTable(); renderChart();});
    return b;
  }
  if(pagesTotal>1 && currentPage>1){
    var prev=document.createElement("button"); prev.textContent="←";
    prev.addEventListener("click",()=>{currentPage=Math.max(1,currentPage-1); renderTable(); renderChart();});
    frag.appendChild(prev);
  }
  if(pagesTotal<=5){
    for(var p=1;p<=pagesTotal;p++) frag.appendChild(pageBtn(p,p===currentPage));
  } else {
    var sp=currentPage-2;
    if(sp<1) sp=1;
    if(sp+4>pagesTotal) sp=pagesTotal-4;
    for(var pp=sp; pp<=sp+4; pp++) frag.appendChild(pageBtn(pp,pp===currentPage));
  }
  if(pagesTotal>1 && currentPage<pagesTotal){
    var next=document.createElement("button"); next.textContent="→";
    next.addEventListener("click",()=>{currentPage=Math.min(pagesTotal,currentPage+1); renderTable(); renderChart();});
    frag.appendChild(next);
  }
  container.appendChild(frag);
}

function renderTable(){
  var all=sortDesc(load()), total=all.length, eff=(pageSize==="all")?(total||1):pageSize;
  var pages=Math.max(1,Math.ceil(total/eff)); if(currentPage>pages) currentPage=pages;
  var start=(currentPage-1)*eff, slice=all.slice(start,start+eff); __currentSlice=slice.slice();

  buildPager(pagerTop,total,eff);
  tb.innerHTML="";
  slice.forEach((r)=>{
    var tr=document.createElement("tr");
    var s=Number(r.weight).toFixed(1).split(".");
    tr.innerHTML =
      '<td class="date">'+isoToBG_YY(r.date)+'</td>'+
      '<td class="w wCell"><span class="wInt">'+s[0]+'</span><span class="wSmall">.'+s[1]+'</span></td>'+
      '<td class="actions">'+
        '<div class="actions">'+
          '<button class="icon" title="Редакция" data-edit="'+r.date+'" aria-label="Редакция" type="button">'+
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21l3-1 11-11-2-2L4 18z"></path><path d="M14 5l5 5"></path></svg>'+
          '</button>'+
          '<button class="icon danger" title="Изтрий" data-del="'+r.date+'" aria-label="Изтрий" type="button">'+
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M7 6l1 14h8l1-14"></path></svg>'+
          '</button>'+
        '</div>'+
      '</td>';
    tb.appendChild(tr);
  });

  Array.from(tb.querySelectorAll('button[data-edit]')).forEach((b)=>{
    b.addEventListener("click",()=>{
      var iso=b.getAttribute("data-edit"); var rec=load().find(x=>x.date===iso);
      if(rec){
        currentISO=iso; localStorage.setItem("bt-last-date",iso);
        dateText.value=isoToBG_YY(iso); prefillFor(iso);
        window.scrollTo({top:0,behavior:"smooth"});
      }
    });
  });
  Array.from(tb.querySelectorAll('button[data-del]')).forEach((b)=>{
    b.addEventListener("click",()=>{
      var iso=b.getAttribute("data-del");
      if(!confirm("Да изтрия записа за "+isoToBG_YY(iso)+"?")) return;
      var data=load().filter(x=>x.date!==iso);
      save(data); renderTable(); renderChart();
    });
  });
  buildPager(pagerBottom,total,eff);
}

function weekKey(iso){
  var d=new Date(iso); d.setUTCHours(0,0,0,0);
  d.setUTCDate(d.getUTCDate()+4-(d.getUTCDay()||7));
  var yearStart=new Date(Date.UTC(d.getUTCFullYear(),0,1));
  var week=Math.ceil((((d-yearStart)/86400000)+1)/7);
  return d.getUTCFullYear()+"-W"+String(week).padStart(2,"0");
}
function monthKey(iso){ var d=new Date(iso); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0"); }
function labelWeek(k){ var s=k.split("-W"); return "С"+s[1]+"."+String(s[0]).slice(2); }
function labelMonth(k){ var s=k.split("-"); return s[1]+"."+String(s[0]).slice(2); }

aggSel.addEventListener("change", ()=>renderChart());

function cssPx(name, fallback){
  var v=getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  var n=parseFloat(v); return Number.isFinite(n)?n:fallback;
}

function getChartRawData(){
  var mode=aggSel.value;
  if(mode==="daily"){
    var src=(__currentSlice && __currentSlice.length)?__currentSlice.slice():sortDesc(load());
    return sortAsc(src);
  }
  return sortAsc(load());
}

function renderChart(){
  var ctx=chart.getContext("2d"), rect=chart.getBoundingClientRect(), dpr=window.devicePixelRatio||1;
  chart.width=Math.round(rect.width*dpr); chart.height=Math.round(360*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
  var w=rect.width, h=360;
  ctx.clearRect(0,0,w,h);

  var raw=getChartRawData();
  if(!raw.length){
    ctx.fillStyle="#9fb4ad";
    ctx.font="700 "+cssPx('--chart-values', 15)+"px system-ui";
    ctx.fillText("Няма данни",10,26);
    return;
  }

  var mode=aggSel.value, pts=[];
  if(mode==="daily"){
    pts=raw.map(r=>({x:r.date,y:r.weight,label:isoToBG_YY(r.date), bt:(r.bt!==false)}));
  } else if(mode==="weekly"){
    var wm=new Map();
    raw.forEach(r=>{ var k=weekKey(r.date); (wm.get(k)||wm.set(k,[]).get(k)).push(r); });
    wm.forEach((arr,k)=>{
      var s=0; for(var i=0;i<arr.length;i++) s+=arr[i].weight;
      var btCount=arr.filter(z=>z.bt!==false).length;
      pts.push({x:k,y:s/arr.length,label:labelWeek(k), bt:(btCount>=arr.length - btCount)});
    });
  } else {
    var mm=new Map();
    raw.forEach(r=>{ var k=monthKey(r.date); (mm.get(k)||mm.set(k,[]).get(k)).push(r); });
    mm.forEach((arr,k)=>{
      var s=0; for(var i=0;i<arr.length;i++) s+=arr[i].weight;
      var btCount=arr.filter(z=>z.bt!==false).length;
      pts.push({x:k,y:s/arr.length,label:labelMonth(k), bt:(btCount>=arr.length - btCount)});
    });
  }

  pts.sort((a,b)=>a.x.localeCompare(b.x));
  var vals=pts.map(p=>p.y).filter(n=>typeof n==="number");

  ctx.font="700 "+cssPx('--chart-values', 15)+"px system-ui";
  if(vals.length<2){
    ctx.fillStyle="#9fb4ad";
    ctx.fillText("Добави поне 2 точки",10,26);
    return;
  }

  var min=Math.min(...vals), max=Math.max(...vals);
  var padL=48, padR=18, padT=16, padB=96, n=pts.length;

  function X(i){ return padL+(w-padL-padR)*(n<=1?0:i/(n-1)); }
  function Y(v){ return h-padB-((v-min)/((max-min)||1))*(h-padT-padB); }

  ctx.strokeStyle="#20343a"; ctx.lineWidth=1.1;
  ctx.beginPath();
  ctx.moveTo(padL,h-padB); ctx.lineTo(w-padR,h-padB);
  ctx.moveTo(padL,padT);   ctx.lineTo(padL,h-padB);
  ctx.stroke();

  for(var i=1;i<n;i++){
    var p0=pts[i-1], p1=pts[i];
    var bothBT = (p0.bt && p1.bt);
    var bothNon = (!p0.bt && !p1.bt);
    ctx.strokeStyle = bothBT ? (getComputedStyle(document.documentElement).getPropertyValue('--line-orange').trim()||'#f59e0b')
                    : bothNon ? (getComputedStyle(document.documentElement).getPropertyValue('--line-green').trim()||'#87f3c5')
                    : (getComputedStyle(document.documentElement).getPropertyValue('--line-neutral').trim()||'#2dd4bf');
    ctx.lineWidth=2.0;
    ctx.beginPath();
    ctx.moveTo(X(i-1), Y(p0.y));
    ctx.lineTo(X(i),   Y(p1.y));
    ctx.stroke();
  }

  ctx.fillStyle="#d9ebe5"; ctx.textBaseline="middle";
  ctx.fillText(String(max.toFixed(1)),10,Y(max));
  ctx.fillText(String(min.toFixed(1)),10,Y(min));

  var maxLabels=Math.min(16,n), step=Math.max(1,Math.floor(n/maxLabels));
  ctx.font="700 "+cssPx('--chart-label', 15)+"px system-ui";

  for(var j=0;j<n;j++){
    var pe=pts[j], x0=X(j), y0=h-padB;
    const yVal = Y(pe.y);

    ctx.beginPath();
    ctx.fillStyle = pe.bt ? (getComputedStyle(document.documentElement).getPropertyValue('--line-orange').trim()||'#f59e0b')
                          : (getComputedStyle(document.documentElement).getPropertyValue('--line-green').trim()||'#87f3c5');
    ctx.arc(x0, yVal, 3, 0, Math.PI*2);
    ctx.fill();

    ctx.save();
    ctx.font = "600 11px system-ui";
    ctx.fillStyle = "#9fb4ad";
    ctx.textBaseline = "bottom"; ctx.textAlign = "left";
    const txt = pe.y.toFixed(1); const tw = ctx.measureText(txt).width;
    let xText = x0 + 5;
    if (xText + tw > w - padR - 2) xText = (w - padR - 2) - tw;
    if (xText < padL + 2) xText = padL + 2;
    ctx.fillText(txt, xText, yVal - 4);
    ctx.restore();

    if(j%step===0){
      ctx.save(); ctx.translate(x0,y0+64); ctx.rotate(-Math.PI/2);
      ctx.fillStyle="#e7faf4"; ctx.fillText(pe.label,0,0); ctx.restore();
    }
  }
}

exportBtn.addEventListener("click", ()=>{
  var data = load();
  var blob = new Blob([JSON.stringify(data,null,2)], {type:"application/json"});
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href=url; a.download="bt-progress-export.json";
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
});

importBtn.addEventListener("click", ()=>importFile.click());
importFile.addEventListener("change", ()=>{
  var f=importFile.files[0]; if(!f) return;
  var fr=new FileReader();
  fr.onload = () => {
    try{
      var arr = JSON.parse(fr.result||"[]");
      if(!Array.isArray(arr)) throw new Error("Невалиден формат");
      arr = arr
        .filter(r => r && typeof r.date==="string" && typeof r.weight==="number")
        .map(r => ({ date:r.date, weight:r.weight, bt:(r.bt!==false) }));
      save(arr); renderTable(); renderChart();
      alert("Импортът е успешен. Записите са презаредени.");
    }catch(e){ alert("Грешка при импорт: "+e.message); }
    importFile.value="";
  };
  fr.readAsText(f);
});

function migrateDatesAndBT(){
  var arr=load(), changed=false;
  for(var i=0;i<arr.length;i++){
    var r=arr[i];
    if(typeof r.date==="string" && !/^\d{4}-\d{2}-\d{2}$/.test(r.date)){
      var iso=bgToISO_any(r.date); if(iso){ r.date=iso; changed=true; }
    }
    if(typeof r.bt==="undefined"){ r.bt=true; changed=true; }
  }
  if(changed) save(arr);
}

function initialRender(){
  migrateDatesAndBT();
  prefillFor(currentISO);
  renderTable(); renderChart();
  window.addEventListener("resize", ()=>renderChart(), {passive:true});
}
initialRender();