import { two, todayISO, TODAY } from './utils.js';
import { ModalLogic } from './modal.js';

/**
 * =================================================================
 * ФАБРИКА ЗА МРЕЖА НА ПРОДУКТ (v3.1.2 logic)
 * =================================================================
 */

export function createProductGrid(options) {
  const TABLE = document.getElementById(options.tableId);
  const INTAKE_BTN = document.getElementById(options.buttonId);
  if (!TABLE) return null;

  const STORAGE_KEY = options.storageKey;
  const INTAKE_LOG_KEY = 'bt_intake_log_v1'; // Споделен лог за всички
  const PRODUCT_NAME = options.productName;
  const BLOCK_ID = options.blockId;

  // Създаваме копие на defaultTimes, за да не се промени оригинала
  const DEFAULT_TIMES = options.defaultTimes.map(row => [...row]);

  let state = loadState();
  let isOverdue = false; // Локален флаг за състояние

  function getTodayDow() { return (new Date()).getDay(); }

  function loadState() {
    try {
      const r = JSON.parse(localStorage.getItem(STORAGE_KEY) || "");
      if (r && r.times && r.times.length >= 1 && r.flag && r.flag.length === r.times.length) {
        for (let row = 0; row < r.times.length; row++) {
          for (let i = 0; i < 7; i++) {
            const s = r.times[row][i];
            if (typeof s === "string" && s.startsWith("24:")) {
              r.times[row][i] = "00:" + s.slice(3);
            }
          }
        }
        if (typeof r.todayDow !== "number") r.todayDow = getTodayDow();
        if (typeof r.activeDow !== "number") r.activeDow = r.todayDow;
        return r;
      }
    } catch (_) {}
    
    // Инициализация
    const numRows = DEFAULT_TIMES.length;
    const flags = Array(numRows).fill(null).map(() => [0, 0, 0, 0, 0, 0, 0]);
    
    const init = {
      times: DEFAULT_TIMES,
      flag: flags,
      todayDow: getTodayDow(),
      activeDow: getTodayDow()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(init));
    return init;
  }

  function saveState(obj) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  }

  // Общи функции за логване (вече не са в инстанцията)
  function loadIntakeLog() {
    try {
      const raw = localStorage.getItem(INTAKE_LOG_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return [];
      const filtered = arr.filter(e => e && e.date === TODAY);
      if (filtered.length !== arr.length) {
        localStorage.setItem(INTAKE_LOG_KEY, JSON.stringify(filtered));
      }
      return filtered;
    } catch (_) { return []; }
  }

  function saveIntakeLog(arr) {
    localStorage.setItem(INTAKE_LOG_KEY, JSON.stringify(arr));
  }
  
  function timeStrToMin(str) {
    const parts = (str || "00:00").split(":");
    let h = parseInt(parts[0], 10), m = parseInt(parts[1], 10);
    if (!Number.isFinite(h)) h = 0;
    if (!Number.isFinite(m)) m = 0;
    if (h < 0) h = 0; if (h > 23) h = 23;
    if (m < 0) m = 0; if (m > 59) m = 59;
    return h * 60 + m;
  }

  // --- Функции, специфични за инстанцията ---

  function getIntakeStateForSlot(row, dow) {
    const now = new Date();
    const todayDow = now.getDay();
    if (dow !== todayDow) return { status: 'normal', has: false };

    const idx = (dow === 0 ? 6 : dow - 1);
    if (!state.times[row] || !state.times[row][idx]) {
      console.error(`Няма дефинирано време за ${PRODUCT_NAME}, ред ${row}, ден ${idx}`);
      return { status: 'normal', has: false };
    }
    
    const tStr = state.times[row][idx];
    const planMin = timeStrToMin(tStr);
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const log = loadIntakeLog();

    // Проверяваме дали има запис за *този продукт*
    const has = log.some(e => e && e.date === TODAY && e.dow === dow && e.row === row && e.product === PRODUCT_NAME);

    if (has) return { status: 'done', has: true };
    if (nowMin >= planMin) {
      return { status: 'overdue', has: false };
    }
    if (nowMin >= planMin - 30) { // 30 мин преди
      return { status: 'upcoming', has: false };
    }
    return { status: 'normal', has: false };
  }

  function toggleIntakeAt(row, dow) {
    let log = loadIntakeLog();
    const idxEntry = log.findIndex(e => e && e.date === TODAY && e.dow === dow && e.row === row && e.product === PRODUCT_NAME);

    if (idxEntry >= 0) {
      log.splice(idxEntry, 1);
      saveIntakeLog(log);
      return false;
    } else {
      const now = new Date();
      const idxDay = (dow === 0 ? 6 : dow - 1);
      const tStr = state.times[row][idxDay];
      log.push({
        ts: now.toISOString(),
        date: TODAY,
        dow: dow,
        row: row,
        time: tStr,
        product: PRODUCT_NAME // Важно!
      });
      saveIntakeLog(log);
      return true;
    }
  }

  function refreshActiveColumnHighlight() {
    const cells = TABLE.querySelectorAll('.pl-time-cell');
    cells.forEach(cell => cell.classList.remove('active-day'));
    if (typeof state.activeDow === "number") {
      cells.forEach(cell => {
        const dow = Number(cell.getAttribute('data-dow'));
        if (dow === state.activeDow) {
          cell.classList.add('active-day');
        }
      });
    }
  }

  function refreshDays() {
    const ths = TABLE.querySelectorAll('thead .pl-day');
    ths.forEach(th => {
      const dow = Number(th.getAttribute('data-dow'));
      th.classList.toggle('today', dow === state.todayDow);
      th.classList.toggle('active', dow === state.activeDow);
    });
    refreshActiveColumnHighlight();
  }

  function renderTimes() {
    const seq = [1, 2, 3, 4, 5, 6, 0];
    for (let row = 0; row < state.times.length; row++) {
      for (let i = 0; i < 7; i++) {
        const dow = seq[i], idx = (dow === 0 ? 6 : dow - 1);
        const cell = TABLE.querySelector(`.pl-time-cell[data-row="${row}"][data-dow="${dow}"]`);
        if (!cell) continue;
        cell.textContent = state.times[row][idx];
        cell.classList.remove('red', 'sel', 'int-upcoming', 'int-done', 'int-overdue', 'active-day');
        const f = (state.flag[row] && state.flag[row][idx]) | 0;
        if (f === 2) cell.classList.add('red');
      }
    }
    refreshActiveColumnHighlight();
    updateProgIntakeButton();
  }
  
  function updateProgIntakeButton() {
    if (!INTAKE_BTN) return;
    const now = new Date();
    const todayDow = now.getDay();
    
    INTAKE_BTN.classList.remove('upcoming', 'overdue', 'done', 'solid');

    if (todayDow < 0 || todayDow > 6) {
      INTAKE_BTN.style.display = 'none';
      INTAKE_BTN.removeAttribute('data-row');
      INTAKE_BTN.removeAttribute('data-dow');
      return;
    }

    let best = null;

    for (let row = 0; row < state.times.length; row++) {
      const { status } = getIntakeStateForSlot(row, todayDow);
      if (status === 'upcoming' || status === 'overdue') {
        const idxDay = (todayDow === 0 ? 6 : todayDow - 1);
        const planMin = timeStrToMin(state.times[row][idxDay]);
        
        if (!best || planMin < best.planMin) {
          best = { row, dow: todayDow, planMin, status: status };
        }
      }
    }

    if (!best) {
      INTAKE_BTN.style.display = 'none';
      INTAKE_BTN.removeAttribute('data-row');
      INTAKE_BTN.removeAttribute('data-dow');
      return;
    }

    INTAKE_BTN.style.display = 'flex';
    INTAKE_BTN.dataset.row = String(best.row);
    INTAKE_BTN.dataset.dow = String(best.dow);

    if (best.status === 'upcoming') {
      INTAKE_BTN.classList.add('upcoming');
    } else if (best.status === 'overdue') {
      INTAKE_BTN.classList.add('overdue');
    }
  }

  function updateIntakeStates() {
    const now = new Date();
    const todayDow = now.getDay();
    isOverdue = false; // Нулираме флага

    if (todayDow !== state.todayDow) {
      state.todayDow = todayDow;
      saveState(state);
      refreshDays();
    }

    const cells = TABLE.querySelectorAll('.pl-time-cell');
    cells.forEach(cell => {
      cell.classList.remove('int-upcoming', 'int-done', 'int-overdue');
      const row = Number(cell.getAttribute('data-row'));
      const dow = Number(cell.getAttribute('data-dow'));
      const idx = (dow === 0 ? 6 : dow - 1);
      const f = (state.flag[row] && state.flag[row][idx]) | 0;
      if (f === 2) return; // Audio Mute
      if (dow !== todayDow) return;

      const { status } = getIntakeStateForSlot(row, dow);
      if (status === 'upcoming') cell.classList.add('int-upcoming');
      else if (status === 'overdue') {
        cell.classList.add('int-overdue');
        isOverdue = true; // Сетваме флага
      }
      else if (status === 'done') cell.classList.add('int-done');
    });

    refreshActiveColumnHighlight();
    updateProgIntakeButton();
    return isOverdue; // Връщаме състоянието
  }

  function blinkCells(cells) {
    if (!cells || !cells.length) return;
    cells.forEach(el => el.classList.add('pl-blink'));
    setTimeout(() => cells.forEach(el => el.classList.remove('pl-blink')), 900 * 3);
  }
  function blinkCell(row, dow) {
    const cell = TABLE.querySelector(`.pl-time-cell[data-row="${row}"][data-dow="${dow}"]`);
    if (cell) blinkCells([cell]);
  }
  function blinkRow(row) {
    const cells = Array.from(TABLE.querySelectorAll(`.pl-time-cell[data-row="${row}"]`));
    blinkCells(cells);
  }

  function normalizeColumnAfterChange(rowIndex, dayIdx, newMinutes) {
    const N = state.times.length;
    if (N <= 0) return;
    const MAX = 23 * 60 + 59;

    const col = new Array(N);
    for (let r = 0; r < N; r++) {
      col[r] = timeStrToMin(state.times[r][dayIdx]);
    }

    let k = rowIndex;
    let minAllowed = (k > 0) ? (col[k - 1] + 1) : 0;
    let maxAllowed = MAX - ((N - 1) - k);

    let nm = newMinutes;
    if (nm < minAllowed) nm = minAllowed;
    if (nm > maxAllowed) nm = maxAllowed;
    col[k] = nm;

    for (let r = k + 1; r < N; r++) {
      if (col[r] <= col[r - 1]) col[r] = col[r - 1] + 1;
    }
    if (col[N - 1] > MAX) {
      col[N - 1] = MAX;
      for (let r = N - 2; r >= 0; r--) {
        if (col[r] >= col[r + 1]) col[r] = Math.max(0, col[r + 1] - 1);
      }
    }

    for (let r = 0; r < N; r++) {
      const h = Math.floor(col[r] / 60), m = col[r] % 60;
      state.times[r][dayIdx] = two(h) + ":" + two(m);
    }
  }

  // --- Добавяме event listeners ---

  TABLE.querySelectorAll('thead .pl-day').forEach(th => {
    th.addEventListener('click', () => {
      state.activeDow = Number(th.getAttribute('data-dow'));
      saveState(state);
      refreshDays();
    });
  });

  TABLE.querySelectorAll('.pl-time-cell').forEach(td => {
    td.addEventListener('click', () => {
      const row = Number(td.getAttribute('data-row'));
      const dow = Number(td.getAttribute('data-dow'));
      
      // Подаваме *контекста* на тази мрежа към глобалния модал
      ModalLogic.showClk(row, dow, td.textContent.trim(), td, {
        productName: PRODUCT_NAME,
        state: state,
        saveState: saveState,
        getIntakeStateForSlot: getIntakeStateForSlot,
        toggleIntakeAt: toggleIntakeAt,
        normalizeColumnAfterChange: normalizeColumnAfterChange,
        renderTimes: renderTimes,
        updateIntakeStates: updateIntakeStates, // Подаваме референция
        blinkCell: blinkCell,
        blinkRow: blinkRow,
        refreshDays: refreshDays // Подаваме и тази
      });
    });
  });

  if (INTAKE_BTN) {
    INTAKE_BTN.addEventListener('click', () => {
      const row = Number(INTAKE_BTN.dataset.row);
      const dow = Number(INTAKE_BTN.dataset.dow);
      if (!Number.isFinite(row) || !Number.isFinite(dow)) return;
      
      const nowDone = toggleIntakeAt(row, dow);
      
      // Извикваме ГЛОБАЛНИЯ ъпдейт,
      // който ще опресни всички мрежи И ще провери за скрол
      window.masterUpdateAllGrids(); 
      
      if (nowDone) {
        blinkCell(row, dow);
      }
    });
  }
  
  // --- Първоначално зареждане ---
  refreshDays();
  renderTimes();
  updateIntakeStates();

  function destroy() {
    // Тази функция ще се вика, за да "убие" инстанцията
    // Засега само изчистваме event listeners, ако има нужда
  }

  // --- Връщаме публичния API ---
  return {
    updateIntakeStates: updateIntakeStates,
    refreshDays: refreshDays,
    isOverdue: () => isOverdue,
    getBlockId: () => BLOCK_ID,
    state: state,
    saveState: saveState,
    destroy: destroy 
  };
}