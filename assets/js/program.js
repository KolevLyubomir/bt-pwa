function buildHourRange(sel, fromH, toH){
  sel.innerHTML="";
  for(let h=fromH; h<=toH; h++){
    const o=document.createElement("option");
    o.value=two(h); o.textContent=o.value;
    if(h===8 || h===12 || h===19) o.className="strong";
    sel.appendChild(o);
  }
}
function buildMinutes5(sel){
  sel.innerHTML="";
  for(let m=0; m<60; m+=5){
    const o=document.createElement("option");
    o.value=two(m); o.textContent=o.value;
    if(m%15===0) o.className="strong";
    sel.appendChild(o);
  }
}
function setSel(sel,val){ const opt=[...sel.options].find(o=>o.value===val); if(opt){ sel.value=val; return true;} return false; }

(function(){
  const DEF={m:"08:00", n:"12:00", e:"19:00"};
  const KEY_SEL='bt_he_sel_v230';
  const KEY_TIM='bt_he_tim_v230';

  const m=document.getElementById('he-m'), n=document.getElementById('he-n'), e=document.getElementById('he-e');
  const boxM=document.getElementById('he-tp-m'), boxN=document.getElementById('he-tp-n'), boxE=document.getElementById('he-tp-e');
  const hhM=document.getElementById('he-hh-m'), mmM=document.getElementById('he-mm-m');
  const hhN=document.getElementById('he-hh-n'), mmN=document.getElementById('he-mm-n');
  const hhE=document.getElementById('he-hh-e'), mmE=document.getElementById('he-mm-e');

  function ensureTim(){
    try{
      const r=JSON.parse(localStorage.getItem(KEY_TIM)||'');
      if(r && r.m && r.n && r.e) return r;
    }catch(_){}
    const def={...DEF};
    localStorage.setItem(KEY_TIM, JSON.stringify(def));
    return def;
  }
  function loadTim(){ try{ return JSON.parse(localStorage.getItem(KEY_TIM))||ensureTim(); }catch(_){ return ensureTim(); } }
  function saveTim(t){ localStorage.setItem(KEY_TIM, JSON.stringify(t)); }

  function loadSel(){ return localStorage.getItem(KEY_SEL)||"n"; }
  function saveSel(v){ localStorage.setItem(KEY_SEL, v); }

  buildHourRange(hhM,0,9);  buildMinutes5(mmM);
  buildHourRange(hhN,10,17); buildMinutes5(mmN);
  buildHourRange(hhE,18,23); buildMinutes5(mmE);

  function setOnly(which){
    m.checked = (which==="m");
    n.checked = (which==="n");
    e.checked = (which==="e");
    boxM.style.display = (which==="m")?"block":"none";
    boxN.style.display = (which==="n")?"block":"none";
    boxE.style.display = (which==="e")?"block":"none";
    saveSel(which);
  }

  function setFromStr(hhSel, mmSel, str){
    const [H,M]=(str||"").split(":");
    if(!setSel(hhSel,H)) hhSel.value=hhSel.options[0].value;
    if(!setSel(mmSel,M)) mmSel.value="00";
  }
  function getStr(hhSel, mmSel){ return (hhSel.value||"00")+":"+(mmSel.value||"00"); }

  const which0=loadSel(); setOnly(which0);
  const t0=ensureTim();
  setFromStr(hhM,mmM,t0.m); setFromStr(hhN,mmN,t0.n); setFromStr(hhE,mmE,t0.e);

  [m,n,e].forEach(el=>el.addEventListener('change',()=>{
    const which = el===m ? "m" : el===n ? "n" : "e";
    setOnly(which);
    const t=loadTim(); saveTim(t);
  }));

  [hhM,mmM,hhN,mmN,hhE,mmE].forEach(sel=> sel.addEventListener('change', ()=>{
    const which = localStorage.getItem(KEY_SEL)||"n";
    const t=loadTim();
    if(which==="m") t.m = getStr(hhM,mmM);
    else if(which==="n") t.n = getStr(hhN,mmN);
    else t.e = getStr(hhE,mmE);
    saveTim(t);
  }));
})();

(function(){
  const DEF={m:"08:00", n:"12:00", e:"19:00"};
  const KEY='bt_ch_tim_v230';

  const hhM=document.getElementById('ch-hh-m'), mmM=document.getElementById('ch-mm-m');
  const hhN=document.getElementById('ch-hh-n'), mmN=document.getElementById('ch-mm-n');
  const hhE=document.getElementById('ch-hh-e'), mmE=document.getElementById('ch-mm-e');

  buildHourRange(hhM,0,9);  buildMinutes5(mmM);
  buildHourRange(hhN,10,17); buildMinutes5(mmN);
  buildHourRange(hhE,18,23); buildMinutes5(mmE);

  function ensure(){
    try{
      const r=JSON.parse(localStorage.getItem(KEY)||'');
      if(r&&r.m&&r.n&&r.e) return r;
    }catch(_){}
    const def={...DEF};
    localStorage.setItem(KEY, JSON.stringify(def));
    return def;
  }
  function load(){ try{ return JSON.parse(localStorage.getItem(KEY))||ensure(); }catch(_){ return ensure(); } }
  function save(t){ localStorage.setItem(KEY, JSON.stringify(t)); }

  function setFromStr(hhSel, mmSel, str){
    const [H,M]=(str||"").split(":");
    if(!setSel(hhSel,H)) hhSel.value=hhSel.options[0].value;
    if(!setSel(mmSel,M)) mmSel.value="00";
  }
  function getStr(hhSel, mmSel){ return (hhSel.value||"00")+":"+(mmSel.value||"00"); }

  const t0=ensure();
  setFromStr(hhM,mmM,t0.m); setFromStr(hhN,mmN,t0.n); setFromStr(hhE,mmE,t0.e);

  function write(){
    save({
      m:getStr(hhM,mmM),
      n:getStr(hhN,mmN),
      e:getStr(hhE,mmE)
    });
  }
  [hhM,mmM,hhN,mmN,hhE,mmE].forEach(sel=> sel.addEventListener('change', write));
  write();
})();

(function(){
  const TABLE = document.getElementById('pl-table'); if(!TABLE) return;
  const btnProgIntakePL = document.getElementById('btnProgIntakePL');
  const KEY='bt_pl_grid_v230';
  const DEF_T1 = ["08:00","08:00","08:00","08:00","08:00","08:00","08:00"];
  const DEF_T2 = ["19:00","19:00","19:00","19:00","19:00","19:00","19:00"];
  const INTAKE_LOG_KEY='bt_intake_log_v1';

  function getTodayDow(){ return (new Date()).getDay(); }

  function load(){
    try{
      const r=JSON.parse(localStorage.getItem(KEY)||"");
      if(r && r.times && r.times.length>=1 && r.flag && r.flag.length===r.times.length){
        for(let row=0; row<r.times.length; row++){
          for(let i=0;i<7;i++){
            const s=r.times[row][i];
            if(typeof s==="string" && s.startsWith("24:")){
              r.times[row][i]="00:"+s.slice(3);
            }
          }
        }
        if(typeof r.todayDow!=="number") r.todayDow=getTodayDow();
        if(typeof r.activeDow!=="number") r.activeDow=r.todayDow;
        return r;
      }
    }catch(_){}
    const init = {
      times:[ [...DEF_T1], [...DEF_T2] ],
      flag:[ [0,0,0,0,0,0,0],[0,0,0,0,0,0,0] ],
      todayDow:getTodayDow(),
      activeDow:getTodayDow()
    };
    localStorage.setItem(KEY, JSON.stringify(init));
    return init;
  }
  function save(obj){ localStorage.setItem(KEY, JSON.stringify(obj)); }

  function loadIntakeLog(){
    try{
      const raw = localStorage.getItem(INTAKE_LOG_KEY);
      if(!raw) return [];
      const arr = JSON.parse(raw);
      if(!Array.isArray(arr)) return [];
      const filtered = arr.filter(e=>e && e.date===TODAY);
      if(filtered.length !== arr.length){
        localStorage.setItem(INTAKE_LOG_KEY, JSON.stringify(filtered));
      }
      return filtered;
    }catch(_){ return []; }
  }
  function saveIntakeLog(arr){
    localStorage.setItem(INTAKE_LOG_KEY, JSON.stringify(arr));
  }

  let state = load();

  function refreshActiveColumnHighlight(){
    const cells = TABLE.querySelectorAll('.pl-time-cell');
    cells.forEach(cell=> cell.classList.remove('active-day'));
    if(typeof state.activeDow === "number"){
      cells.forEach(cell=>{
        const dow = Number(cell.getAttribute('data-dow'));
        if(dow === state.activeDow){
          cell.classList.add('active-day');
        }
      });
    }
  }

  function refreshDays(){
    const ths = TABLE.querySelectorAll('thead .pl-day');
    ths.forEach(th=>{
      const dow = Number(th.getAttribute('data-dow'));
      th.classList.toggle('today', dow===state.todayDow);
      th.classList.toggle('active', dow===state.activeDow);
    });
    refreshActiveColumnHighlight();
  }

  function renderTimes(){
    const seq=[1,2,3,4,5,6,0];
    for(let row=0; row<state.times.length; row++){
      for(let i=0;i<7;i++){
        const dow = seq[i], idx=(dow===0?6:dow-1);
        const cell = TABLE.querySelector('.pl-time-cell[data-row="'+row+'"][data-dow="'+dow+'"]');
        if(!cell) continue;
        cell.textContent = state.times[row][idx];
        cell.classList.remove('red','sel','int-upcoming','int-done','int-overdue','active-day');
        const f = (state.flag[row] && state.flag[row][idx])|0;
        if(f===2) cell.classList.add('red');
      }
    }
    refreshActiveColumnHighlight();
    updateProgIntakeButton();
  }

  function timeStrToMin(str){
    const parts=(str||"00:00").split(":");
    let h=parseInt(parts[0],10), m=parseInt(parts[1],10);
    if(!Number.isFinite(h)) h=0;
    if(!Number.isFinite(m)) m=0;
    if(h<0) h=0; if(h>23) h=23;
    if(m<0) m=0; if(m>59) m=59;
    return h*60+m;
  }

  function getIntakeStateForSlot(row,dow){
    const now = new Date();
    const todayIso = TODAY;
    const todayDow = now.getDay();
    if(dow !== todayDow) return 'normal';
    const idx = (dow===0?6:dow-1);
    const tStr = state.times[row][idx];
    const planMin = timeStrToMin(tStr);
    const nowMin = now.getHours()*60 + now.getMinutes();
    const log = loadIntakeLog();
    const has = log.some(e=>e && e.date===todayIso && e.dow===dow && e.row===row);
    if(has) return 'done';
    if(nowMin >= planMin){
      return 'overdue';
    }
    if(nowMin >= planMin - 30){
      return 'upcoming';
    }
    return 'normal';
  }

  function toggleIntakeAt(row,dow){
    let log = loadIntakeLog();
    const idxEntry = log.findIndex(e=>e && e.date===TODAY && e.dow===dow && e.row===row);
    if(idxEntry>=0){
      log.splice(idxEntry,1);
      saveIntakeLog(log);
      return false;
    }else{
      const now = new Date();
      const idxDay = (dow===0?6:dow-1);
      const tStr = state.times[row][idxDay];
      log.push({
        ts: now.toISOString(),
        date: TODAY,
        dow,
        row,
        time: tStr
      });
      saveIntakeLog(log);
      return true;
    }
  }

  function updateProgIntakeButton(){
    if(!btnProgIntakePL) return;
    const now = new Date();
    const todayDow = now.getDay();
    const idxDay = (todayDow===0?6:todayDow-1);

    btnProgIntakePL.classList.remove('upcoming','overdue','done','solid');

    if(todayDow<0 || todayDow>6){
      btnProgIntakePL.style.display='none';
      btnProgIntakePL.removeAttribute('data-row');
      btnProgIntakePL.removeAttribute('data-dow');
      return;
    }

    const nowMin = now.getHours()*60 + now.getMinutes();
    let best=null;

    for(let row=0; row<state.times.length; row++){
      const tStr = state.times[row][idxDay];
      const planMin = timeStrToMin(tStr);
      const st = getIntakeStateForSlot(row, todayDow);
      if(st==='upcoming' || st==='overdue'){
        if(!best || planMin<best.planMin){
          best={row,dow:todayDow,planMin,status:st};
        }
      }
    }

    if(!best){
      btnProgIntakePL.style.display='none';
      btnProgIntakePL.removeAttribute('data-row');
      btnProgIntakePL.removeAttribute('data-dow');
      return;
    }

    btnProgIntakePL.style.display='flex';
    btnProgIntakePL.dataset.row = String(best.row);
    btnProgIntakePL.dataset.dow = String(best.dow);

    if(best.status==='upcoming'){
      btnProgIntakePL.classList.add('upcoming');
    }else if(best.status==='overdue'){
      btnProgIntakePL.classList.add('overdue');
    }
  }

  function updateIntakeStates(){
    const now = new Date();
    const todayDow = now.getDay();

    if(todayDow !== state.todayDow){
      state.todayDow = todayDow;
      save(state);
      refreshDays();
    }

    const cells = TABLE.querySelectorAll('.pl-time-cell');
    cells.forEach(cell=>{
      cell.classList.remove('int-upcoming','int-done','int-overdue');
      const row = Number(cell.getAttribute('data-row'));
      const dow = Number(cell.getAttribute('data-dow'));
      const idx=(dow===0?6:dow-1);
      const f = (state.flag[row] && state.flag[row][idx])|0;
      if(f===2) return;
      if(dow!==todayDow) return;
      const st = getIntakeStateForSlot(row,dow);
      if(st==='upcoming') cell.classList.add('int-upcoming');
      else if(st==='overdue') cell.classList.add('int-overdue');
      else if(st==='done') cell.classList.add('int-done');
    });

    refreshActiveColumnHighlight();
    updateProgIntakeButton();
  }

  function blinkCells(cells){
    if(!cells || !cells.length) return;
    cells.forEach(el=> el.classList.add('pl-blink'));
    setTimeout(()=> cells.forEach(el=> el.classList.remove('pl-blink')), 900*3);
  }
  function blinkCell(row,dow){
    const cell = TABLE.querySelector('.pl-time-cell[data-row="'+row+'"][data-dow="'+dow+'"]');
    if(cell) blinkCells([cell]);
  }
  function blinkRow(row){
    const cells = Array.from(TABLE.querySelectorAll('.pl-time-cell[data-row="'+row+'"]'));
    blinkCells(cells);
  }

  refreshDays(); renderTimes(); updateIntakeStates();

  TABLE.querySelectorAll('thead .pl-day').forEach(th=>{
    th.addEventListener('click', ()=>{
      state.activeDow = Number(th.getAttribute('data-dow'));
      save(state); refreshDays();
    });
  });

  const Modal = document.getElementById('clk');
  const Card  = document.getElementById('clkCard');
  const face  = document.getElementById('clkFace');
  const ringH = document.getElementById('ringH');
  const ringM = document.getElementById('ringM');
  const handH = document.getElementById('handH');
  const handM = document.getElementById('handM');
  const readBox  = document.getElementById('clkRead');
  const keyInput = document.getElementById('clkKeyInput');

  const btnSaveOne   = document.getElementById('btnSaveOne');
  const btnSaveAll   = document.getElementById('btnSaveAllDays');
  const btnIntake    = document.getElementById('btnIntake');
  const btnAudio     = document.getElementById('btnAudio');

  const clkProductEl = document.getElementById('clk-product');
  const clkWeekdayEl = document.getElementById('clk-weekday');

  let selRow=0, selDow=1, activeCell=null;
  let H=8, M=0, focusHM='H';

  let digits = {d1:0,d2:0,d3:0,d4:0};
  let editPos = 1;
  let isEditing = false;

  let ampmCycle = 0;
  let lastDispHour = 12;

  function normalizeColumnAfterChange(rowIndex, dayIdx, newMinutes){
    const N = state.times.length;
    if(N<=0) return;
    const MAX=23*60+59;

    const col=new Array(N);
    for(let r=0;r<N;r++){
      const parts = (state.times[r][dayIdx]||"00:00").split(':');
      let h=parseInt(parts[0],10), m=parseInt(parts[1],10);
      if(!Number.isFinite(h)) h=0;
      if(!Number.isFinite(m)) m=0;
      if(h<0) h=0; if(h>23) h=23;
      if(m<0) m=0; if(m>59) m=59;
      col[r] = h*60+m;
    }

    let k=rowIndex;
    let minAllowed = (k>0) ? (col[k-1] + 1) : 0;
    let maxAllowed = MAX - ((N-1)-k);

    let nm = newMinutes;
    if(nm<minAllowed) nm=minAllowed;
    if(nm>maxAllowed) nm=maxAllowed;
    col[k]=nm;

    for(let r=k+1;r<N;r++){
      if(col[r] <= col[r-1]) col[r] = col[r-1] + 1;
    }
    if(col[N-1]>MAX){
      col[N-1]=MAX;
      for(let r=N-2;r>=0;r--){
        if(col[r]>=col[r+1]) col[r]=Math.max(0,col[r+1]-1);
      }
    }

    for(let r=0;r<N;r++){
      const h=Math.floor(col[r]/60), m=col[r]%60;
      state.times[r][dayIdx] = two(h)+":"+two(m);
    }
  }

  function hour24ToDisp(h24){
    if(h24===24) return {disp:12, cycle:1};
    const cycle = (h24>=13)?1:0;
    const disp = ((h24-1)%12)+1;
    return {disp, cycle};
  }
  function dispToHour24(disp, cycle){
    if(cycle===0) return disp;
    return disp===12 ? 24 : (disp+12);
  }

  function recomputeAmpmFromTime(){
    ampmCycle = (H>=13 || H===24) ? 1 : 0;
    const d = hour24ToDisp(H);
    lastDispHour = d.disp;
  }

  function syncDigitsFromTime(){
    const hDisp = (H===24 ? 0 : H);
    const hs = two(hDisp);
    const ms = two(M);
    digits.d1 = parseInt(hs[0],10)||0;
    digits.d2 = parseInt(hs[1],10)||0;
    digits.d3 = parseInt(ms[0],10)||0;
    digits.d4 = parseInt(ms[1],10)||0;
  }

  function renderDigits(){
    if(!readBox) return;
    const map = {1:digits.d1, 2:digits.d2, 3:digits.d3, 4:digits.d4};
    for(let pos=1; pos<=4; pos++){
      const span = readBox.querySelector('.clk-digit[data-pos="'+pos+'"]');
      if(!span) continue;
      span.textContent = String(map[pos]);
      span.classList.toggle('active', isEditing && pos===editPos);
    }
  }

  function updateRead(){
    renderDigits();
  }

  function setHands(){
    const d = hour24ToDisp(H);
    const degH = (d.disp%12)*30 + (M/60)*30;
    const degM = M*6;
    handH.style.transform = 'translate(-50%,-100%) rotate('+degH+'deg)';
    handM.style.transform = 'translate(-50%,-100%) rotate('+degM+'deg)';
  }
  function clear(node){ while(node.firstChild) node.removeChild(node.firstChild); }

  function buildHours(){
    clear(ringH);
    for(let i=1;i<=12;i++){
      const el=document.createElement('div');
      el.className='clk-tick hour'+((i===12 || i===3 || i===6 || i===9)?' strong':'');
      el.dataset.disp = String(i);
      el.textContent = toRoman(i);

      const ang = (Math.PI*2) * (i%12)/12 - Math.PI/2;
      const R=76;
      const SIZE=30;
      const x=Math.cos(ang)*R, y=Math.sin(ang)*R;
      el.style.width = SIZE+'px';
      el.style.height = SIZE+'px';
      el.style.left='calc(50% + '+(x-SIZE/2)+'px)';
      el.style.top ='calc(50% + '+(y-SIZE/2)+'px)';

      const h24 = dispToHour24(i, ampmCycle);
      if(h24===H) el.classList.add('sel');

      el.addEventListener('click', ()=>{
        H = dispToHour24(i, ampmCycle);
        recomputeAmpmFromTime();
        syncDigitsFromTime(); updateRead(); setHands();
        buildHours();
        focusHM='H';
      });

      ringH.appendChild(el);
    }
  }

  function refreshMinuteTicks(){
    const children = ringM ? Array.from(ringM.children) : [];
    children.forEach(el=>{
      const m = parseInt(el.dataset.min,10);
      if(!Number.isFinite(m)) return;
      const isMajor = (m % 5 === 0);
      el.classList.toggle('sel', m===M);
      if(isMajor){
        el.textContent = (m===0 ? "60" : two(m));
      } else {
        el.textContent = '·';
      }
    });
  }

  function buildMins(){
    clear(ringM);
    for(let m=0; m<60; m++){
      const isMajor = (m % 5 === 0);
      const isQuarter = (m===0 || m===15 || m===30 || m===45);

      let cls = 'clk-tick';
      if(isMajor){
        cls += ' strong';
        if(isQuarter) cls += ' quarter';
      } else {
        cls += ' minor';
      }

      const el = document.createElement('div');
      el.className = cls;
      el.dataset.min = String(m);

      el.textContent = isMajor ? (m===0 ? "60" : two(m)) : '·';

      const ang = (Math.PI*2) * (m/60) - Math.PI/2;
      const R = isMajor ? 120 : 108;
      const size = isMajor ? 20 : 8;
      const x = Math.cos(ang)*R;
      const y = Math.sin(ang)*R;
      el.style.width = size+'px';
      el.style.height = size+'px';
      el.style.left = 'calc(50% + '+(x-size/2)+'px)';
      el.style.top  = 'calc(50% + '+(y-size/2)+'px)';

      el.addEventListener('click', ()=>{
        M = m;
        recomputeAmpmFromTime();
        syncDigitsFromTime(); updateRead(); setHands();
        refreshMinuteTicks();
        buildHours();
        focusHM='M';
      });

      ringM.appendChild(el);
    }
    refreshMinuteTicks();
  }

  function commitDigitsToTime(){
    const hourCandidate = digits.d1*10 + digits.d2;
    const minCandidate  = digits.d3*10 + digits.d4;
    if(hourCandidate>24 || minCandidate>60) return;

    let newH = (hourCandidate===0?24:hourCandidate);
    let newM = (minCandidate===60?0:minCandidate);

    H = newH;
    M = newM;

    syncDigitsFromTime();
    recomputeAmpmFromTime();
    updateRead();
    setHands();
    buildMins();
    buildHours();
  }

  function validateOnMove(oldPos,newPos){
    const hourCandidate = digits.d1*10 + digits.d2;
    const minCandidate  = digits.d3*10 + digits.d4;
    const invalidHour = hourCandidate>24;
    const invalidMin  = minCandidate>60;

    const movingWithinHour = ( (oldPos===1 && newPos===2) || (oldPos===2 && newPos===1) );
    const leavingHour = (oldPos===1 || oldPos===2) && !(newPos===1 || newPos===2);

    if(movingWithinHour || leavingHour){
      if(!invalidHour && !invalidMin){
        commitDigitsToTime();
      } else if(invalidHour){
        const hDisp=(H===24?0:H);
        const hs=two(hDisp);
        digits.d1=parseInt(hs[0],10)||0;
        digits.d2=parseInt(hs[1],10)||0;
      }
    }

    const movingWithinMin = ( (oldPos===3 && newPos===4) || (oldPos===4 && newPos===3) );
    const leavingMin = (oldPos===3 || oldPos===4) && !(newPos===3 || newPos===4);

    if(movingWithinMin || leavingMin){
      if(!invalidHour && !invalidMin){
        commitDigitsToTime();
      } else if(invalidMin){
        const ms=two(M);
        digits.d3=parseInt(ms[0],10)||0;
        digits.d4=parseInt(ms[1],10)||0;
      }
    }
  }

  function setEditPos(newPos){
    const oldPos = editPos;
    const clamped = Math.max(1, Math.min(4,newPos));
    if(oldPos !== clamped){
      validateOnMove(oldPos, clamped);
    }
    editPos = clamped;
    renderDigits();
  }

  function handleDigitCell(d){
    if(d<0 || d>9) return;

    if(editPos===1){
      digits.d1 = d;
    } else if(editPos===2){
      digits.d2 = d;
    } else if(editPos===3){
      digits.d3 = d;
    } else if(editPos===4){
      digits.d4 = d;
    }

    commitDigitsToTime();
    if(editPos<4) setEditPos(editPos+1);
  }

  function handleBackspaceCell(){
    if(editPos===1) digits.d1=0;
    else if(editPos===2) digits.d2=0;
    else if(editPos===3) digits.d3=0;
    else digits.d4=0;

    commitDigitsToTime();
  }

  function hideClk(){
    Modal.classList.remove('show');
    Modal.setAttribute('aria-hidden','true');
    document.body.style.overflow='';
    if(activeCell){ activeCell.classList.remove('sel'); activeCell=null; }
    stopEditing();
  }

  function handleTimeKey(ev){
    if(!isEditing) return;

    if(ev.ctrlKey || ev.metaKey){
      return;
    }

    const k = ev.key;

    if(k === 'Tab' || k === 'Shift' || k === 'Alt' || k.startsWith('F')) return;

    if(k === 'ArrowLeft'){
      ev.preventDefault();
      setEditPos(editPos-1);
      return;
    }
    if(k === 'ArrowRight'){
      ev.preventDefault();
      setEditPos(editPos+1);
      return;
    }

    if(k === 'ArrowUp' || k === 'ArrowDown'){
      ev.preventDefault();
      const dir = (k === 'ArrowUp') ? 1 : -1;
      if(focusHM==='H'){
        const prevH = H;
        if(dir>0){ H = (H===24)?1:(H+1); }
        else     { H = (H===1)?24:(H-1); }

        if( (prevH===12 && H===13) || (prevH===13 && H===12) ||
            (prevH===24 && H===1)  || (prevH===1  && H===24) ){
          ampmCycle = 1 - ampmCycle;
        }

        recomputeAmpmFromTime();
        syncDigitsFromTime(); updateRead(); setHands(); buildHours();
      }else{
        const prev=M;
        if(dir>0){
          if(prev===59){
            M=0;
            H=(H===24)?1:(H+1);
          }else{
            M=prev+1;
          }
        }else{
          if(prev===0){
            M=59;
            H=(H===1)?24:(H-1);
          }else{
            M=prev-1;
          }
        }
        recomputeAmpmFromTime();
        syncDigitsFromTime(); updateRead(); setHands();
        buildMins(); buildHours();
      }
      return;
    }

    if(k === 'Backspace' || k === 'Delete'){
      ev.preventDefault();
      handleBackspaceCell();
      return;
    }

    if(k === 'Enter'){
      ev.preventDefault();
      return;
    }

    if(k === 'Escape'){
      ev.preventDefault();
      hideClk();
      return;
    }

    if(k >= '0' && k <= '9'){
      ev.preventDefault();
      handleDigitCell(parseInt(k,10));
      return;
    }

    ev.preventDefault();
  }

  function ptAngle(cx,cy, x,y){
    const dx=x-cx, dy=y-cy;
    let ang=Math.atan2(dy,dx);
    ang+=Math.PI/2;
    if(ang<0) ang+=Math.PI*2;
    return ang;
  }
  function angleToDispHour(ang){
    let frac = ang/(Math.PI*2);
    let idx = Math.round(frac*12) % 12;
    let disp = idx===0 ? 12 : idx;
    return disp;
  }

  let dragging=null;

  function setFromAngleHours(ang){
    const disp = angleToDispHour(ang);
    const prev = lastDispHour;
    if(disp!==prev){
      if( (prev===12 && disp===1) || (prev===1 && disp===12) ){
        ampmCycle = 1 - ampmCycle;
      }
      lastDispHour = disp;
    }
    H = dispToHour24(disp, ampmCycle);
    recomputeAmpmFromTime();
    syncDigitsFromTime(); updateRead(); setHands();
    buildHours();
    focusHM='H';
  }

  function setFromAngleMins(ang){
    let v=Math.round((ang/(Math.PI*2))*60)%60; if(v<0) v+=60;
    const prev = M;
    if(prev===59 && v===0){
      H = (H===24) ? 1 : (H+1);
    } else if(prev===0 && v===59){
      H = (H===1) ? 24 : (H-1);
    }
    M=v;
    recomputeAmpmFromTime();
    syncDigitsFromTime(); updateRead(); setHands();
    refreshMinuteTicks();
    buildHours();
    focusHM='M';
  }

  function handleMove(e){
    if(!dragging) return;
    const rect=face.getBoundingClientRect();
    const cx=rect.left+rect.width/2, cy=rect.top+rect.height/2;
    const pt = e.touches? e.touches[0] : e;
    const ang=ptAngle(cx,cy,pt.clientX,pt.clientY);
    if(dragging==='H') setFromAngleHours(ang);
    else setFromAngleMins(ang);
  }
  function startDrag(which, e){ dragging=which; handleMove(e); }
  function endDrag(){ dragging=null; }

  ringH.addEventListener('pointerdown', (e)=>{ e.preventDefault(); startDrag('H',e); });
  ringM.addEventListener('pointerdown', (e)=>{ e.preventDefault(); startDrag('M',e); });
  window.addEventListener('pointermove', handleMove, {passive:false});
  window.addEventListener('pointerup', endDrag);

  ringH.addEventListener('touchstart', (e)=>{ startDrag('H',e); }, {passive:false});
  ringM.addEventListener('touchstart', (e)=>{ startDrag('M',e); }, {passive:false});
  window.addEventListener('touchmove', handleMove, {passive:false});
  window.addEventListener('touchend', endDrag);

  function startEditing(pos){
    isEditing = true;
    if(readBox) readBox.classList.add('editing');
    if(typeof pos==="number") setEditPos(pos);
    else renderDigits();
    if(keyInput){
      keyInput.value="";
      keyInput.focus();
    }
  }
  function stopEditing(){
    if(isEditing){
      const hourCandidate = digits.d1*10 + digits.d2;
      const minCandidate  = digits.d3*10 + digits.d4;
      if(hourCandidate<=24 && minCandidate<=60){
        commitDigitsToTime();
      }else{
        syncDigitsFromTime();
        updateRead();
      }
    }
    isEditing = false;
    if(readBox) readBox.classList.remove('editing');
    renderDigits();
    if(keyInput){
      keyInput.blur();
      keyInput.value="";
    }
  }

  function handleReadClick(ev){
    if(!readBox) return;
    const digitSpan = ev.target.closest('.clk-digit');
    const pos = digitSpan ? (Number(digitSpan.getAttribute('data-pos'))||editPos) : editPos;
    if(!isEditing){
      startEditing(pos);
    }else{
      setEditPos(pos);
      if(keyInput){ keyInput.focus(); }
    }
  }

  if(readBox){
    readBox.addEventListener('click', handleReadClick);
    readBox.addEventListener('paste', (e)=>{
      if(!isEditing) return;
      const txt = (e.clipboardData && e.clipboardData.getData('text')) || "";
      if(!txt) return;
      e.preventDefault();
      const nums = txt.replace(/\D+/g,"");
      for(const ch of nums){
        const d = ch.charCodeAt(0)-48;
        if(d>=0 && d<=9) handleDigitCell(d);
      }
    });
  }
  if(keyInput){
    keyInput.addEventListener('keydown', handleTimeKey);
    keyInput.addEventListener('input', ()=>{
      if(!isEditing){
        keyInput.value="";
        return;
      }
      const txt = keyInput.value || "";
      keyInput.value="";
      const nums = txt.replace(/\D+/g,"");
      for(const ch of nums){
        const d = ch.charCodeAt(0)-48;
        if(d>=0 && d<=9) handleDigitCell(d);
      }
    });
  }

  document.addEventListener('click',(e)=>{
    if(!isEditing) return;
    if(readBox && readBox.contains(e.target)) return;
    if(e.target === keyInput) return;
    stopEditing();
  });

  TABLE.querySelectorAll('.pl-time-cell').forEach(td=>{
    td.addEventListener('click', ()=>{
      const row = Number(td.getAttribute('data-row'));
      const dow = Number(td.getAttribute('data-dow'));
      showClk(row, dow, td.textContent.trim(), td);
    });
  });

  function updateIntakeButtonForCurrent(){
    if(!btnIntake) return;
    btnIntake.classList.remove('upcoming','overdue','done','solid');
    const st = getIntakeStateForSlot(selRow, selDow);
    if(st==='upcoming') btnIntake.classList.add('upcoming');
    else if(st==='overdue') btnIntake.classList.add('overdue');
    else if(st==='done'){ btnIntake.classList.add('done'); }
  }

  function updateAudioButtonForCurrent(){
    if(!btnAudio) return;
    btnAudio.classList.remove('on','off');
    const idx = (selDow===0?6:selDow-1);
    const f = (state.flag[selRow] && state.flag[selRow][idx])|0;
    if(f===2) btnAudio.classList.add('off');
    else      btnAudio.classList.add('on');
  }

  function showClk(row,dow,initial, cell){
    if(activeCell) activeCell.classList.remove('sel');
    activeCell = cell; if(activeCell) activeCell.classList.add('sel');

    selRow=row; selDow=dow;
    state.activeDow = dow; save(state); refreshDays();

    if(clkProductEl){
      var prod = "ProLact Slim+";
      var pkg = TABLE.closest ? TABLE.closest('#pkg-core') : null;
      if(pkg){
        var capEl = pkg.querySelector('.prog-head-main .prog-cap');
        if(capEl && capEl.textContent){ prod = capEl.textContent; }
      }
      clkProductEl.textContent = prod;
    }
    if(clkWeekdayEl){
      var names = ['неделя','понеделник','вторник','сряда','четвъртък','петък','събота'];
      var w = (dow>=0 && dow<names.length)?names[dow]:"";
      clkWeekdayEl.textContent = w;
    }

    const idx = (dow===0?6:dow-1);
    const parts = (initial||state.times[row][idx]).split(':');
    const h = parseInt(parts[0],10);
    const m = parseInt(parts[1],10);

    let hh = isFinite(h) ? h : 8;
    if (hh === 0) hh = 24;
    H = hh;
    M = isFinite(m) ? m : 0;
    focusHM='H';

    recomputeAmpmFromTime();
    syncDigitsFromTime();
    editPos = 1;
    stopEditing();
    updateRead();
    setHands();
    buildHours(); buildMins();

    updateIntakeButtonForCurrent();
    updateAudioButtonForCurrent();

    Modal.classList.add('show');
    Modal.setAttribute('aria-hidden','false');
    document.body.style.overflow='hidden';
  }

  Modal.addEventListener('click',(e)=>{ if(e.target===Modal) hideClk(); });

  function applyTimeForCurrentCell(normalizeAllDays){
    const idx = (selDow===0?6:selDow-1);
    const hSave = (H === 24 ? 0 : H);
    const newMinutes = hSave*60 + M;

    if(normalizeAllDays){
      for(let d=0; d<7; d++){
        normalizeColumnAfterChange(selRow, d, newMinutes);
      }
    }else{
      normalizeColumnAfterChange(selRow, idx, newMinutes);
    }
  }

  function handleSaveOne(){
    applyTimeForCurrentCell(false);
    save(state);
    renderTimes();
    updateIntakeStates();
    blinkCell(selRow, selDow);
    hideClk();
  }

  function handleSaveAllDays(){
    applyTimeForCurrentCell(true);
    save(state);
    renderTimes();
    updateIntakeStates();
    blinkRow(selRow);
    hideClk();
  }

  function handleAudioToggle(){
    const idx = (selDow===0?6:selDow-1);
    applyTimeForCurrentCell(false);

    const cur = (state.flag[selRow] && state.flag[selRow][idx])|0;
    const next = (cur===2 ? 0 : 2);
    state.flag[selRow][idx] = next;

    save(state);
    renderTimes();
    updateIntakeStates();
    updateAudioButtonForCurrent();
    blinkCell(selRow, selDow);
    hideClk();
  }

  function handleIntake(){
    const nowDone = toggleIntakeAt(selRow, selDow);
    updateIntakeStates();
    updateIntakeButtonForCurrent();
    updateProgIntakeButton();
    if(nowDone){
      blinkCell(selRow, selDow);
    }
  }

  btnSaveOne.addEventListener('click', handleSaveOne);
  btnSaveAll.addEventListener('click', handleSaveAllDays);
  btnAudio.addEventListener('click', handleAudioToggle);
  btnIntake.addEventListener('click', handleIntake);

  if(btnProgIntakePL){
    btnProgIntakePL.addEventListener('click', ()=>{
      const row = Number(btnProgIntakePL.dataset.row);
      const dow = Number(btnProgIntakePL.dataset.dow);
      if(!Number.isFinite(row) || !Number.isFinite(dow)) return;
      const nowDone = toggleIntakeAt(row, dow);
      updateIntakeStates();
      updateProgIntakeButton();
      if(nowDone){
        blinkCell(row, dow);
      }
    });
  }

  (function markDays(){
    state.todayDow = (new Date()).getDay();
    if(typeof state.activeDow!=="number") state.activeDow = state.todayDow;
    save(state); refreshDays(); updateIntakeStates();
  })();

  setInterval(updateIntakeStates, 60000);
})();