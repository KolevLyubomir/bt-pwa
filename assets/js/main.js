"use strict";
function two(n){ return String(n).padStart(2,"0"); }
function todayISO(){ var d=new Date(); d.setMinutes(d.getMinutes()-d.getTimezoneOffset()); return d.toISOString().slice(0,10); }
var TODAY = todayISO();

function toRoman(num){
  const romans = [
    [1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],
    [100,'C'],[90,'XC'],[50,'L'],[40,'XL'],
    [10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']
  ];
  let res = '';
  for (const [v,sym] of romans){
    while(num >= v){
      res += sym;
      num -= v;
    }
  }
  return res;
}

(function(){
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
})();

// (Предишният код за версията, който беше тук, е ИЗТРИТ)