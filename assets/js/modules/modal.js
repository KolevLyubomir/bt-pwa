/* MODAL.JS (Fixed Formatting & Aria) */
import { two, toRoman } from './utils.js';

export function initModal() {
  console.log("🔹 Modal module initialized");

  const Modal = document.getElementById('clk');
  if (!Modal) return;

  const ringH = document.getElementById('ringH');
  const ringM = document.getElementById('ringM');
  const handH = document.getElementById('handH');
  const handM = document.getElementById('handM');
  const readBox = document.getElementById('clkRead');
  const keyInput = document.getElementById('clkKeyInput');
  const face = document.getElementById('clkFace');

  const btnSaveOne = document.getElementById('btnSaveOne');
  const btnSaveAll = document.getElementById('btnSaveAllDays');
  const btnClose = document.getElementById('btnCloseClk');
  const clkProductEl = document.getElementById('clk-product');
  const clkWeekdayEl = document.getElementById('clk-weekday');

  let currentContext = null;
  let activeH = 8, activeM = 0;
  let focusMode = 'H';
  let isDragging = false;

  // --- ФУНКЦИЯ ЗА РИСУВАНЕ (С НАСИЛСТВЕНО ПОЗИЦИОНИРАНЕ) ---
  function drawClockFace() {
    if(!ringH || !ringM) return;
    ringH.innerHTML = "";
    ringM.innerHTML = "";

    // Настройка на радиуса (разстояние от центъра)
    const RADIUS = 86; 

    // --- 1. ЧАСОВЕ ---
    for (let i = 1; i <= 12; i++) {
      let deg = i * 30;
      let el = document.createElement("div");
      el.className = "clk-num";
      
      // БРОНИРАНО ЦЕНТРИРАНЕ: Игнорираме CSS и ги заковаваме в центъра
      Object.assign(el.style, {
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: '0',
          height: '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `rotate(${deg}deg) translateY(-${RADIUS}px)`
      });

      let sp = document.createElement("span");
      sp.textContent = toRoman(i);
      sp.style.transform = `rotate(-${deg}deg)`; // Завъртаме текста да е прав
      sp.style.display = "block";
      sp.style.width = "30px"; // Даваме малко въздух на цифрата
      sp.style.textAlign = "center";
      
      el.appendChild(sp);
      ringH.appendChild(el);
    }

    // --- 2. МИНУТИ ---
    for (let i = 0; i < 12; i++) {
      let mVal = i * 5;
      let deg = i * 30;
      let el = document.createElement("div");
      el.className = "clk-num min"; // Важен клас за стиловете (цвят/шрифт)
      
      // БРОНИРАНО ЦЕНТРИРАНЕ
      Object.assign(el.style, {
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: '0',
          height: '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `rotate(${deg}deg) translateY(-${RADIUS}px)`
      });
      
      let sp = document.createElement("span");
      sp.textContent = mVal;
      sp.style.transform = `rotate(-${deg}deg)`;
      sp.style.display = "block";
      sp.style.width = "30px";
      sp.style.textAlign = "center";
      
      el.appendChild(sp);
      ringM.appendChild(el);
    }
  }

  function updateHands() {
    let degH = (activeH % 12) * 30 + activeM * 0.5;
    let degM = activeM * 6;

    if(handH) handH.style.transform = `translateX(-50%) rotate(${degH}deg)`;
    if(handM) handM.style.transform = `translateX(-50%) rotate(${degM}deg)`;
    updateDigitalRead();
  }

  function updateDigitalRead() {
    if(!readBox) return;
    const hEl = readBox.querySelector('#clkH');
    const mEl = readBox.querySelector('#clkM');
    
    // Обновяване на текста
    if(hEl) {
        let sH = two(activeH);
        hEl.children[0].textContent = sH[0];
        hEl.children[1].textContent = sH[1];
        if(focusMode === 'H') hEl.classList.add('active'); else hEl.classList.remove('active');
    }
    
    if(mEl) {
        let sM = two(activeM);
        mEl.children[0].textContent = sM[0];
        mEl.children[1].textContent = sM[1];
        if(focusMode === 'M') mEl.classList.add('active'); else mEl.classList.remove('active');
    }
    
    // СМЯНА НА ВИДИМОСТТА (Часове vs Минути)
    if(focusMode === 'H') {
        if(ringH) { ringH.style.opacity = 1; ringH.style.pointerEvents = "auto"; }
        if(ringM) { ringM.style.opacity = 0; ringM.style.pointerEvents = "none"; }
    } else {
        if(ringH) { ringH.style.opacity = 0; ringH.style.pointerEvents = "none"; }
        if(ringM) { ringM.style.opacity = 1; ringM.style.pointerEvents = "auto"; }
    }
  }

  function openModal(data) {
    currentContext = data;
    if(clkProductEl) clkProductEl.textContent = data.productName || "Продукт";
    
    if(clkWeekdayEl) {
       const days = ['Неделя', 'Понеделник', 'Вторник', 'Сряда', 'Четвъртък', 'Петък', 'Събота'];
       let d = parseInt(data.dow, 10);
       if(isNaN(d)) d = 0;
       clkWeekdayEl.textContent = days[d] || "";
    }

    let parts = (data.time || "08:00").split(":");
    activeH = parseInt(parts[0], 10) || 8;
    activeM = parseInt(parts[1], 10) || 0;
    
    // Ресетваме на часове при отваряне
    focusMode = 'H';

    updateHands();
    
    // ARIA FIX: Казваме на браузъра, че прозорецът е видим
    Modal.classList.add('show');
    Modal.setAttribute('aria-hidden', 'false');
    
    if(keyInput) keyInput.value = "";
  }

  function saveAndClose(applyToAll) {
    if (!currentContext) return;
    const newTime = two(activeH) + ":" + two(activeM);
    
    const event = new CustomEvent('bt-modal-save', {
        detail: { ...currentContext, newTime: newTime, applyToAll: applyToAll }
    });
    document.dispatchEvent(event);
    
    // ARIA FIX: Скриваме го
    Modal.classList.remove('show');
    Modal.setAttribute('aria-hidden', 'true');
  }

  // --- EVENTS ---
  document.addEventListener('bt-open-modal', (e) => openModal(e.detail));

  if(face) {
      face.addEventListener('mousedown', () => isDragging = true);
      document.addEventListener('mouseup', () => isDragging = false);
      face.addEventListener('mousemove', (e) => {
          if(isDragging) updateFromEvent(e);
      });
      face.addEventListener('click', (e) => {
          updateFromEvent(e);
          // Авто-смяна: Ако цъкнеш час, мини на минути
          if(focusMode === 'H') {
              focusMode = 'M';
          }
          updateHands();
      });
      
      // Touch support
      face.addEventListener('touchstart', (e) => { isDragging = true; updateFromEvent(e); }, {passive:false});
      face.addEventListener('touchmove', (e) => { 
        if(isDragging) { e.preventDefault(); updateFromEvent(e); } 
      }, {passive:false});
      face.addEventListener('touchend', () => isDragging = false);
  }

  function updateFromEvent(e) {
      const rect = face.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const dx = clientX - cx;
      const dy = clientY - cy;
      let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      if (angle < 0) angle += 360;

      if(focusMode === 'H') {
          let h = Math.round(angle / 30);
          if (h === 0) h = 12;
          activeH = h; 
      } else {
          let m = Math.round(angle / 6);
          if (m === 60) m = 0;
          activeM = m;
      }
      updateHands();
  }

  if(btnSaveOne) btnSaveOne.addEventListener('click', () => saveAndClose(false));
  if(btnSaveAll) btnSaveAll.addEventListener('click', () => saveAndClose(true));
  if(btnClose) btnClose.addEventListener('click', () => {
      Modal.classList.remove('show');
      Modal.setAttribute('aria-hidden', 'true');
  });
  
  if(readBox) {
      readBox.querySelector('#clkH').addEventListener('click', () => { focusMode='H'; updateHands(); });
      readBox.querySelector('#clkM').addEventListener('click', () => { focusMode='M'; updateHands(); });
  }

  drawClockFace();
}