import { two, toRoman } from './utils.js';

export function initModal() {
  console.log("🔹 Modal module initialized (Clean DOM version)");

  const Modal = document.getElementById('clk');
  if (!Modal) return;

  // Елементи
  const ringH = document.getElementById('ringH');
  const ringM = document.getElementById('ringM');
  const handH = document.getElementById('handH');
  const handM = document.getElementById('handM');
  const readBox = document.getElementById('clkRead');
  const keyInput = document.getElementById('clkKeyInput');
  const face = document.getElementById('clkFace');
  
  // Бутони и текстове
  const btnSaveOne = document.getElementById('btnSaveOne');
  const btnSaveAll = document.getElementById('btnSaveAllDays');
  const btnClose = document.getElementById('btnCloseClk');
  const clkProductEl = document.getElementById('clk-product');
  const clkWeekdayEl = document.getElementById('clk-weekday');

  // Състояние
  let currentContext = null;
  let activeH = 8, activeM = 0;
  let focusMode = 'H'; // 'H' (Часове) или 'M' (Минути)
  let isDragging = false;

  // ============================================================
  // 1. РИСУВАНЕ НА ЦИФЕРБЛАТА (Изчистено от inline styles)
  // ============================================================
  function drawClockFace() {
    if(!ringH || !ringM) return;
    ringH.innerHTML = "";
    ringM.innerHTML = "";

    // --- ЧАСОВЕ (1..12) ---
    // Генерираме ги точно в този ред, за да работят CSS селекторите (nth-child) за bold
    for (let i = 1; i <= 12; i++) {
      let deg = i * 30; // 30 градуса на час
      
      let el = document.createElement("div");
      el.className = "clk-num"; 
      // Единственият стил, който слагаме с JS е ротацията, защото е математика
      // CSS-ът (program-clock.css) се грижи за ширината, височината и центрирането
      el.style.transform = `rotate(${deg}deg) translateY(-84px)`;

      let sp = document.createElement("span");
      sp.innerText = toRoman(i);
      // Завъртаме текста обратно, за да е прав
      sp.style.transform = `rotate(-${deg}deg)`;
      
      el.appendChild(sp);
      ringH.appendChild(el);
    }

    // --- МИНУТИ (0, 5, ... 55) ---
    for (let i = 0; i < 12; i++) {
      let mVal = i * 5;
      let deg = i * 30;

      let el = document.createElement("div");
      el.className = "clk-num min"; // Този клас е важен за CSS-а
      el.style.transform = `rotate(${deg}deg) translateY(-84px)`;

      let sp = document.createElement("span");
      sp.innerText = mVal;
      sp.style.transform = `rotate(-${deg}deg)`;
      
      el.appendChild(sp);
      ringM.appendChild(el);
    }
  }

  // ============================================================
  // 2. ДВИЖЕНИЕ НА СТРЕЛКИТЕ
  // ============================================================
  function updateHands() {
    // Час: (Час % 12) * 30 + (Минути * 0.5)
    let degH = (activeH % 12) * 30 + activeM * 0.5;
    // Минути: Минути * 6
    let degM = activeM * 6;

    if(handH) handH.style.transform = `translateX(-50%) rotate(${degH}deg)`;
    if(handM) handM.style.transform = `translateX(-50%) rotate(${degM}deg)`;
    
    updateDigitalRead();
  }

  // ============================================================
  // 3. ЦИФРОВ ЧАСОВНИК И ПРЕВКЛЮЧВАНЕ (H / M)
  // ============================================================
  function updateDigitalRead() {
    if(!readBox) return;
    const hEl = readBox.querySelector('#clkH');
    const mEl = readBox.querySelector('#clkM');
    
    // Обновяване на текста (HH:MM)
    if(hEl) {
        let sH = two(activeH);
        hEl.children[0].textContent = sH[0];
        hEl.children[1].textContent = sH[1];
        // Класът active контролира цвета в CSS
        if(focusMode === 'H') hEl.classList.add('active'); else hEl.classList.remove('active');
    }
    
    if(mEl) {
        let sM = two(activeM);
        mEl.children[0].textContent = sM[0];
        mEl.children[1].textContent = sM[1];
        if(focusMode === 'M') mEl.classList.add('active'); else mEl.classList.remove('active');
    }
    
    // ПРЕВКЛЮЧВАНЕ НА ВИДИМОСТТА (Ключов момент)
    // Ползваме opacity, за да не чупим лейаута
    if(focusMode === 'H') {
        if(ringH) { ringH.style.opacity = 1; ringH.style.pointerEvents = "auto"; }
        if(ringM) { ringM.style.opacity = 0; ringM.style.pointerEvents = "none"; }
    } else {
        if(ringH) { ringH.style.opacity = 0; ringH.style.pointerEvents = "none"; }
        if(ringM) { ringM.style.opacity = 1; ringM.style.pointerEvents = "auto"; }
    }
  }

  // ============================================================
  // 4. ОТВАРЯНЕ НА МОДАЛА
  // ============================================================
  function openModal(data) {
    currentContext = data;
    if(clkProductEl) clkProductEl.textContent = data.productName || "Продукт";
    
    // Ден от седмицата
    if(clkWeekdayEl) {
       const days = ['Неделя', 'Понеделник', 'Вторник', 'Сряда', 'Четвъртък', 'Петък', 'Събота'];
       let d = parseInt(data.dow, 10);
       if(isNaN(d)) d = 0; // fallback
       clkWeekdayEl.textContent = days[d] || "";
    }

    // Парсване на часа
    let parts = (data.time || "08:00").split(":");
    activeH = parseInt(parts[0], 10) || 8;
    activeM = parseInt(parts[1], 10) || 0;
    
    // Винаги започваме с часовете
    focusMode = 'H';

    updateHands();
    
    Modal.classList.add('show');
    Modal.setAttribute('aria-hidden', 'false'); // Accessibility
    
    if(keyInput) keyInput.value = "";
  }

  function saveAndClose(applyToAll) {
    if (!currentContext) return;
    const newTime = two(activeH) + ":" + two(activeM);
    
    const event = new CustomEvent('bt-modal-save', {
        detail: { ...currentContext, newTime: newTime, applyToAll: applyToAll }
    });
    document.dispatchEvent(event);
    
    closeModal();
  }

  function closeModal() {
      Modal.classList.remove('show');
      Modal.setAttribute('aria-hidden', 'true');
  }

  // ============================================================
  // 5. EVENT LISTENERS
  // ============================================================
  
  // Слушаме за отваряне от таблицата
  document.addEventListener('bt-open-modal', (e) => openModal(e.detail));

  // Интеракция с циферблата (Click & Drag)
  if(face) {
      // Mouse events
      face.addEventListener('mousedown', () => isDragging = true);
      document.addEventListener('mouseup', () => isDragging = false);
      face.addEventListener('mousemove', (e) => {
          if(isDragging) updateFromEvent(e);
      });
      
      // Click event
      face.addEventListener('click', (e) => {
          updateFromEvent(e);
          // Умна логика: ако си избрал час, автоматично мини на минути за удобство
          if(focusMode === 'H') {
              focusMode = 'M';
          }
          updateHands();
      });
      
      // Touch events
      face.addEventListener('touchstart', (e) => { isDragging = true; updateFromEvent(e); }, {passive:false});
      face.addEventListener('touchmove', (e) => { 
        if(isDragging) { e.preventDefault(); updateFromEvent(e); } 
      }, {passive:false});
      face.addEventListener('touchend', () => isDragging = false);
  }

  // Изчисляване на ъгъла при клик
  function updateFromEvent(e) {
      const rect = face.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      const dx = clientX - cx;
      const dy = clientY - cy;
      
      // Магията за ъгъла (0 градуса е горе = -90 корекция в JS Math)
      let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      if (angle < 0) angle += 360;

      if(focusMode === 'H') {
          // Прилепване към най-близкия час (30 градуса)
          let h = Math.round(angle / 30);
          if (h === 0) h = 12;
          activeH = h; 
      } else {
          // Прилепване към най-близката минута (6 градуса)
          let m = Math.round(angle / 6);
          if (m === 60) m = 0;
          activeM = m;
      }
      updateHands();
  }

  // Бутони
  if(btnSaveOne) btnSaveOne.addEventListener('click', () => saveAndClose(false));
  if(btnSaveAll) btnSaveAll.addEventListener('click', () => saveAndClose(true));
  if(btnClose) btnClose.addEventListener('click', closeModal);
  
  // Клик върху цифрите горе (HH:MM) за ръчна смяна
  if(readBox) {
      readBox.querySelector('#clkH').addEventListener('click', () => { focusMode='H'; updateHands(); });
      readBox.querySelector('#clkM').addEventListener('click', () => { focusMode='M'; updateHands(); });
  }

  // Първоначално рисуване
  drawClockFace();
}