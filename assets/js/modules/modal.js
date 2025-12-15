/* MODAL.JS (Module Version) */
import { two, toRoman } from './utils.js';

export function initModal() {
  console.log("🔹 Modal module initialized");

  const Modal = document.getElementById('clk');
  if (!Modal) return; 

  const Card = document.getElementById('clkCard');
  const face = document.getElementById('clkFace');
  const ringH = document.getElementById('ringH');
  const ringM = document.getElementById('ringM');
  const handH = document.getElementById('handH');
  const handM = document.getElementById('handM');
  const readBox = document.getElementById('clkRead');
  const keyInput = document.getElementById('clkKeyInput');

  const btnSaveOne = document.getElementById('btnSaveOne');
  const btnSaveAll = document.getElementById('btnSaveAllDays');
  const btnIntake = document.getElementById('btnIntake');
  const btnAudio = document.getElementById('btnAudio');
  const btnClose = document.getElementById('btnCloseClk');

  const clkProductEl = document.getElementById('clk-product');
  const clkWeekdayEl = document.getElementById('clk-weekday');

  // Internal state
  let currentContext = null;
  let activeH = 8, activeM = 0;
  let focusMode = 'H'; // 'H' or 'M'
  let isDragging = false;

  // --- Clock UI Rendering ---
  function drawClockFace() {
    if(!ringH || !ringM) return;
    ringH.innerHTML = "";
    ringM.innerHTML = "";

    // Hours (1-12)
    for (let i = 1; i <= 12; i++) {
      let deg = i * 30;
      let el = document.createElement("div");
      el.className = "clk-num";
      el.textContent = toRoman(i);
      el.style.transform = `rotate(${deg}deg) translateY(-84px)`;
      // Counter-rotate text
      let sp = document.createElement("span");
      sp.textContent = toRoman(i);
      sp.style.transform = `rotate(-${deg}deg)`;
      sp.style.display = "block";
      el.innerHTML = "";
      el.appendChild(sp);
      ringH.appendChild(el);
    }

    // Minutes (0, 5, 10...)
    for (let i = 0; i < 12; i++) {
      let mVal = i * 5;
      let deg = i * 30;
      let el = document.createElement("div");
      el.className = "clk-num min";
      el.textContent = mVal;
      el.style.transform = `rotate(${deg}deg) translateY(-84px)`;
      let sp = document.createElement("span");
      sp.textContent = mVal;
      sp.style.transform = `rotate(-${deg}deg)`;
      sp.style.display = "block";
      el.innerHTML = "";
      el.appendChild(sp);
      ringM.appendChild(el);
    }
  }

  function updateHands() {
    // Hours: 30 deg per hour + 0.5 deg per minute
    let degH = (activeH % 12) * 30 + activeM * 0.5;
    // Minutes: 6 deg per minute
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
    
    if(focusMode === 'H') {
        if(ringH) ringH.style.opacity = 1;
        if(ringM) ringM.style.opacity = 0;
    } else {
        if(ringH) ringH.style.opacity = 0;
        if(ringM) ringM.style.opacity = 1;
    }
  }

  // --- Interaction Logic ---
  function openModal(data) {
    currentContext = data; // { productName, row, dow, time, callback }
    
    if(clkProductEl) clkProductEl.textContent = data.productName || "Продукт";
    if(clkWeekdayEl) {
        const days = ['Неделя', 'Понеделник', 'Вторник', 'Сряда', 'Четвъртък', 'Петък', 'Събота'];
        let d = parseInt(data.dow, 10);
        if(isNaN(d)) d = 0; // fallback
        clkWeekdayEl.textContent = days[d] || "";
    }

    // Parse time
    let parts = (data.time || "08:00").split(":");
    activeH = parseInt(parts[0], 10) || 8;
    activeM = parseInt(parts[1], 10) || 0;
    focusMode = 'H';

    updateHands();
    Modal.classList.add('show');
    
    // Reset key input
    if(keyInput) { keyInput.value = ""; keyInput.focus(); }
  }

  function saveAndClose(applyToAll) {
    if (!currentContext) return;
    
    const newTime = two(activeH) + ":" + two(activeM);
    
    // Dispatch save event back to the app
    const event = new CustomEvent('bt-modal-save', {
        detail: {
            ...currentContext,
            newTime: newTime,
            applyToAll: applyToAll
        }
    });
    document.dispatchEvent(event);
    
    Modal.classList.remove('show');
  }

  // --- Event Setup ---
  // LISTEN FOR OPEN REQUEST
  document.addEventListener('bt-open-modal', function(e) {
    console.log("🔔 Modal received open request", e.detail);
    openModal(e.detail);
  });

  // Clock face interactions
  if(face) {
      face.addEventListener('mousedown', startDrag);
      face.addEventListener('touchstart', startDrag, {passive: false});
      face.addEventListener('click', handleClockClick);
  }

  function startDrag(e) { isDragging = true; }
  document.addEventListener('mouseup', () => isDragging = false);
  document.addEventListener('touchend', () => isDragging = false);
  
  if(face) {
      face.addEventListener('mousemove', drag);
      face.addEventListener('touchmove', drag, {passive: false});
  }

  function drag(e) {
      if(!isDragging) return;
      e.preventDefault();
      updateFromEvent(e);
  }

  function handleClockClick(e) {
      updateFromEvent(e);
      // If clicked on H, switch to M
      if(focusMode === 'H') focusMode = 'M';
      updateHands();
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
          // Snap to 12 hours
          let h = Math.round(angle / 30);
          if (h === 0) h = 12;
          activeH = h;
          // PM adjustment logic could be added here (AM/PM toggles), 
          // but sticking to simple 12h visual for now, outputting 24h as per input context if needed.
          // For simplicity in this refactor, we assume 24h input but 12h clock face.
          // Correct 24h logic: If input was > 12, keep it PM.
          // Simple fix:
          if(activeH > 12) activeH -= 12; // normalize for visual
          // (Real logic needs AM/PM toggle or assumptions)
      } else {
          // Snap to 60 minutes
          let m = Math.round(angle / 6);
          if (m === 60) m = 0;
          activeM = m;
      }
      updateHands();
  }

  // Buttons
  if(btnSaveOne) btnSaveOne.addEventListener('click', () => saveAndClose(false));
  if(btnSaveAll) btnSaveAll.addEventListener('click', () => saveAndClose(true));
  if(btnClose) btnClose.addEventListener('click', () => Modal.classList.remove('show'));
  
  // Digit switch
  if(readBox) {
      readBox.querySelector('#clkH').addEventListener('click', () => { focusMode='H'; updateHands(); });
      readBox.querySelector('#clkM').addEventListener('click', () => { focusMode='M'; updateHands(); });
  }

  // Init
  drawClockFace();
}