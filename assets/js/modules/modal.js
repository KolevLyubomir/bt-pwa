/* MODAL.JS (Module Version - RESTORED ORIGINAL LOGIC) */
import { two, toRoman } from './utils.js';

export function initModal() {
  console.log("🔹 Modal module initialized");

  const Modal = document.getElementById('clk');
  if (!Modal) return;

  const face = document.getElementById('clkFace');
  const ringH = document.getElementById('ringH');
  const ringM = document.getElementById('ringM');
  const handH = document.getElementById('handH');
  const handM = document.getElementById('handM');
  const readBox = document.getElementById('clkRead');
  const keyInput = document.getElementById('clkKeyInput');

  const btnSaveOne = document.getElementById('btnSaveOne');
  const btnSaveAll = document.getElementById('btnSaveAllDays');
  const btnClose = document.getElementById('btnCloseClk');
  const btnIntake = document.getElementById('btnIntake'); // Добавен бутон за прием
  const btnAudio = document.getElementById('btnAudio'); // Добавен бутон за аудио

  const clkProductEl = document.getElementById('clk-product');
  const clkWeekdayEl = document.getElementById('clk-weekday');

  let currentContext = null;
  let activeH = 8, activeM = 0;
  let focusMode = 'H';
  let isDragging = false;

  // --- ВРЪЩАНЕ НА ОРИГИНАЛНАТА ЛОГИКА ЗА РИСУВАНЕ (CSS Rotate) ---
  function drawClockFace() {
    if(!ringH || !ringM) return;
    ringH.innerHTML = "";
    ringM.innerHTML = "";

    // Часове (1-12)
    for (let i = 1; i <= 12; i++) {
      let deg = i * 30;
      let el = document.createElement("div");
      el.className = "clk-num";
      // Оригинална CSS ротация: завъртаме контейнера, после връщаме текста обратно
      el.style.transform = `rotate(${deg}deg) translateY(-84px)`; 
      
      let sp = document.createElement("span");
      sp.textContent = toRoman(i);
      sp.style.transform = `rotate(-${deg}deg)`; // Контра-ротация за текста
      sp.style.display = "block";
      
      el.appendChild(sp);
      ringH.appendChild(el);
    }

    // Минути (0, 5, 10... 55)
    for (let i = 0; i < 12; i++) {
      let mVal = i * 5;
      let deg = i * 30;
      let el = document.createElement("div");
      el.className = "clk-num min"; // Класът min е важен за CSS!
      el.style.transform = `rotate(${deg}deg) translateY(-84px)`;
      
      let sp = document.createElement("span");
      sp.textContent = mVal;
      sp.style.transform = `rotate(-${deg}deg)`;
      sp.style.display = "block";
      
      el.appendChild(sp);
      ringM.appendChild(el);
    }
  }

  function updateHands() {
    // 12 часа * 30 градуса + минути * 0.5 градуса
    let degH = (activeH % 12) * 30 + activeM * 0.5;
    // 60 минути * 6 градуса
    let degM = activeM * 6;

    if(handH) handH.style.transform = `translateX(-50%) rotate(${degH}deg)`;
    if(handM) handM.style.transform = `translateX(-50%) rotate(${degM}deg)`;
    updateDigitalRead();
  }

  function updateDigitalRead() {
    if(!readBox) return;
    const hEl = readBox.querySelector('#clkH');
    const mEl = readBox.querySelector('#clkM');
    
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
    
    // ЛОГИКА ЗА СКРИВАНЕ/ПОКАЗВАНЕ
    if(focusMode === 'H') {
        if(ringH) ringH.style.opacity = 1;
        if(ringM) ringM.style.opacity = 0;
    } else {
        if(ringH) ringH.style.opacity = 0;
        if(ringM) ringM.style.opacity = 1;
    }
  }

  function openModal(data) {
    currentContext = data;
    if(clkProductEl) clkProductEl.textContent = data.productName || "Продукт";
    
    if(clkWeekdayEl) {
       const days = ['Неделя', 'Понеделник', 'Вторник', 'Сряда', 'Четвъртък', 'Петък', 'Събота'];
       let d = parseInt(data.dow, 10);
       // data.dow идва като JS ден (0=Неделя), така че е директен индекс
       if(isNaN(d)) d = 0;
       clkWeekdayEl.textContent = days[d] || "";
    }

    let parts = (data.time || "08:00").split(":");
    activeH = parseInt(parts[0], 10) || 8;
    activeM = parseInt(parts[1], 10) || 0;
    focusMode = 'H';

    updateHands();
    Modal.classList.add('show');
    if(keyInput) keyInput.value = "";
  }

  function saveAndClose(applyToAll) {
    if (!currentContext) return;
    const newTime = two(activeH) + ":" + two(activeM);
    
    const event = new CustomEvent('bt-modal-save', {
        detail: { ...currentContext, newTime: newTime, applyToAll: applyToAll }
    });
    document.dispatchEvent(event);
    Modal.classList.remove('show');
  }

  // --- Listeners ---
  document.addEventListener('bt-open-modal', (e) => openModal(e.detail));

  if(face) {
      face.addEventListener('mousedown', () => isDragging = true);
      document.addEventListener('mouseup', () => isDragging = false);
      face.addEventListener('mousemove', (e) => {
          if(isDragging) updateFromEvent(e);
      });
      // Click logic
      face.addEventListener('click', (e) => {
          updateFromEvent(e);
          // Автоматично превключване: ако сме на Час -> мини на Минути
          if(focusMode === 'H') {
              focusMode = 'M';
          }
          updateHands();
      });
      // Тъч поддръжка
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
          // Snap to 12 hours (30 degrees)
          let h = Math.round(angle / 30);
          if (h === 0) h = 12;
          activeH = h; 
      } else {
          // Snap to 60 minutes (6 degrees)
          let m = Math.round(angle / 6);
          if (m === 60) m = 0;
          activeM = m;
      }
      updateHands();
  }

  if(btnSaveOne) btnSaveOne.addEventListener('click', () => saveAndClose(false));
  if(btnSaveAll) btnSaveAll.addEventListener('click', () => saveAndClose(true));
  if(btnClose) btnClose.addEventListener('click', () => Modal.classList.remove('show'));
  
  // Клик върху цифрите горе вдясно за смяна на режима
  if(readBox) {
      readBox.querySelector('#clkH').addEventListener('click', () => { focusMode='H'; updateHands(); });
      readBox.querySelector('#clkM').addEventListener('click', () => { focusMode='M'; updateHands(); });
  }

  // Init
  drawClockFace();
}