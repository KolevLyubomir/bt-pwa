"use strict";

const tabs = [
  {btn: document.getElementById('tab-data'), panel: document.getElementById('panel-data')},
  {btn: document.getElementById('tab-program'), panel: document.getElementById('panel-program')}
];

function select(i){
  tabs.forEach((t,idx)=>{
    const sel = idx===i;
    t.btn.setAttribute('aria-selected', String(sel));
    t.panel.setAttribute('aria-hidden', String(!sel));
  });
  try{ localStorage.setItem('bt_active_tab_v230', String(i)); }catch(_){}
}

tabs.forEach((t,idx)=> t.btn.addEventListener('click', ()=>select(idx)));

try{
  const saved = parseInt(localStorage.getItem('bt_active_tab_v230'),10);
  if(Number.isInteger(saved) && saved>=0 && saved<tabs.length) select(saved); else select(0);
}catch(_){ select(0); }