/* MODAL.JS (Module Version - Original "Xerox" Logic) */
import { two, toRoman } from './utils.js';

export function initModal() {
  console.log("🔹 Modal module initialized (Original Logic Restored)");

  // --- DOM Elements ---
  const Modal = document.getElementById('clk');
  if (!Modal) return;

  const face = document.getElementById('clkFace');
  const ringH = document.getElementById('ringH');
  const ringM = document.getElementById('ringM');
  const handH = document.getElementById('handH');
  const handM = document.getElementById('handM');
  const readBox = document.getElementById('clkRead');
  const keyInput = document.getElementById('clkKeyInput');

  // Buttons
  const btnSaveOne = document.getElementById('btnSaveOne');
  const btnSaveAll = document.getElementById('btnSaveAllDays');
  const btnClose = document.getElementById('btnCloseClk');
  
  // Header Info
  const clkProductEl = document.getElementById('clk-product');
  const clkWeekdayEl = document.getElementById('clk-weekday');

  // --- State ---
  let currentContext = null; // Тук пазим данните (row, day, product...)
  let H = 8, M = 0;
  let focusHM = 'H'; // 'H' or 'M'
  let isDragging = false;

  // ============================================================
  // 1. РИСУВАНЕ НА ЦИФЕРБЛАТА (ТОЧНО КАКТО БЕШЕ В СТАРИЯ КОД)
  // ============================================================
  function drawClock() {
    if (!ringH || !ringM) return;
    ringH.innerHTML = "";
    ringM.innerHTML = "";

    // --- Часове (Rotated) ---
    for (let i = 1; i <= 12; i++) {
      let deg = i * 30;
      let el = document.createElement("div");
      el.className = "clk-num";
      // Това е оригиналната магия, която пасва на твоя CSS:
      el.style.transform = "rotate(" + deg + "deg) translateY(-84px)";

      let sp = document.createElement("span");
      sp.innerText = toRoman(i);
      sp.style.transform = "rotate(-" + deg + "deg)";
      sp.style.display = "block";
      
      el.appendChild(sp);
      ringH.appendChild(el);
    }

    // --- Минути (Rotated) ---
    for (let i = 0; i < 12; i++) {
      let mVal = i * 5;
      let deg = i * 30;
      let el = document.createElement("div");
      el.className = "clk-num min"; // Важният клас от CSS
      el.style.transform = "rotate(" + deg + "deg) translateY(-84px)";

      let sp = document.createElement("span");
      sp.innerText = mVal;
      sp.style.transform = "rotate(-" + deg + "deg)";
      sp.style.display = "block";

      el.appendChild(sp);
      ringM.appendChild(el);
    }
  }

  // ============================================================
  // 2. ОБНОВЯВАНЕ НА СТРЕЛКИ И ЦИФРОВ ЧАСОВНИК
  // ============================================================
  function updateHands() {
    // Math: (H % 12)*30 + M*0.5
    let degH = (H % 12) * 30 + M * 0.5;
    let degM = M * 6;

    if (handH) handH.style.transform = "translateX(-50%) rotate(" + degH + "deg)";
    if (handM) handM.style.transform = "translateX(-50%) rotate(" + degM + "deg)";

    renderDigi();
  }

  function renderDigi() {
    if (!readBox) return;
    const hEl = readBox.querySelector('#clkH');
    const mEl = readBox.querySelector('#clkM');

    if (hEl) {
      const s = two(H);
      hEl.children[0].innerText = s[0];
      hEl.children[1].innerText = s[1];
      if (focusHM === 'H') hEl.classList.add('active');
      else hEl.classList.remove('active');
    }

    if (mEl) {
      const s = two(M);
      mEl.children[0].innerText = s[0];
      mEl.children[1].innerText = s[1];
      if (focusHM === 'M') mEl.classList.add('active');
      else mEl.classList.remove('active');
    }

    // Логика за показване/скриване на пръстените
    if (focusHM === 'H') {
      if (ringH) { ringH.style.opacity = 1; ringH.style.pointerEvents = 'auto'; }
      if (ringM) { ringM.style.opacity = 0; ringM.style.pointerEvents = 'none'; }
    } else {
      if (ringH) { ringH.style.opacity = 0; ringH.style.pointerEvents = 'none'; }
      if (ringM) { ringM.style.opacity = 1; ringM.style.pointerEvents = 'auto'; }
    }
  }

  // ============================================================
  // 3. ОТВАРЯНЕ (Извиква се чрез Event)
  // ============================================================
  function open(data) {
    currentContext = data;
    
    // Попълване на заглавия
    if (clkProductEl) clkProductEl.textContent = data.productName || "";
    if (clkWeekdayEl) {
      // data.dow идва като число (0=Нд, 1=Пн...)
      const names = ['Неделя', 'Понеделник', 'Вторник', 'Сряда', 'Четвъртък', 'Петък', 'Събота'];
      let d = parseInt(data.dow, 10);
      if (isNaN(d)) d = 0;
      clkWeekdayEl.textContent = names[d] || "";
    }

    // Парсване на часа
    let parts = (data.time || "08:00").split(":");
    let hh = parseInt(parts[0], 10);
    let mm = parseInt(parts[1], 10);
    
    H = isFinite(hh) ? hh : 8;
    M = isFinite(mm) ? mm : 0;
    
    focusHM = 'H';
    updateHands();

    Modal.classList.add('show');
    Modal.setAttribute('aria-hidden', 'false');
    if(keyInput) keyInput.value = "";
  }

  // ============================================================
  // 4. ЗАПИСВАНЕ И ЗАТВАРЯНЕ
  // ============================================================
  function save(applyToAll) {
    if (!currentContext) return;
    
    const newTime = two(H) + ":" + two(M);

    // Изпращаме събитие към Grid-а, той ще си запази данните
    const event = new CustomEvent('bt-modal-save', {
      detail: {
        ...currentContext,
        newTime: newTime,
        applyToAll: applyToAll
      }
    });
    document.dispatchEvent(event);

    close();
  }

  function close() {
    Modal.classList.remove('show');
    Modal.setAttribute('aria-hidden', 'true');
  }

  // ============================================================
  // 5. ИНТЕРАКЦИЯ С ЦИФЕРБЛАТА (Click logic)
  // ============================================================
  function handleFaceClick(e) {
    updateFromEvent(e);
    // Авто-смяна: Час -> Минути
    if (focusHM === 'H') {
      focusHM = 'M';
      updateHands();
    }
  }

  function handleFaceMove(e) {
    if (isDragging) {
      e.preventDefault(); // Важно за тъч екрани
      updateFromEvent(e);
    }
  }

  function updateFromEvent(e) {
    const rect = face.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const dx = clientX - cx;
    const dy = clientY - cy;
    
    // 0 deg is at 3 o'clock, so +90 puts it at 12 o'clock
    let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;

    if (focusHM === 'H') {
      // Snap to 12 hours (30 deg)
      let h = Math.round(angle / 30);
      if (h === 0) h = 12;
      H = h;
    } else {
      // Snap to 60 minutes (6 deg)
      let m = Math.round(angle / 6);
      if (m === 60) m = 0;
      M = m;
    }
    updateHands();
  }

  // ============================================================
  // 6. ЗАКАЧАНЕ НА LISTENERS (INIT)
  // ============================================================
  
  // Custom Events (Връзката с другите модули)
  document.addEventListener('bt-open-modal', (e) => open(e.detail));

  // Mouse / Touch Events
  if (face) {
    face.addEventListener('mousedown', () => isDragging = true);
    document.addEventListener('mouseup', () => isDragging = false);
    face.addEventListener('mousemove', handleFaceMove);
    face.addEventListener('click', handleFaceClick);

    // Touch
    face.addEventListener('touchstart', (e) => { isDragging = true; handleFaceMove(e); }, {passive: false});
    face.addEventListener('touchmove', handleFaceMove, {passive: false});
    face.addEventListener('touchend', () => isDragging = false);
  }

  // Buttons
  if (btnSaveOne) btnSaveOne.addEventListener('click', () => save(false));
  if (btnSaveAll) btnSaveAll.addEventListener('click', () => save(true));
  if (btnClose) btnClose.addEventListener('click', close);

  // Toggle H/M via text click
  if (readBox) {
    const hEl = readBox.querySelector('#clkH');
    const mEl = readBox.querySelector('#clkM');
    if(hEl) hEl.addEventListener('click', () => { focusHM='H'; updateHands(); });
    if(mEl) mEl.addEventListener('click', () => { focusHM='M'; updateHands(); });
  }

  // Първоначално рисуване
  drawClock();
}