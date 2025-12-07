import { two, toRoman } from './utils.js';

/**
 * =================================================================
 * ОБЩА ЛОГИКА ЗА МОДАЛНИЯ ПРОЗОРЕЦ (ЧАСОВНИКА)
 * =================================================================
 */

// ПРЕМАХНАТО: const ModalLogic = (function() {

const Modal = document.getElementById('clk');
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

// Референция към бутона за затваряне (X)
const btnClose = document.getElementById('btnCloseClk');

const clkProductEl = document.getElementById('clk-product');
const clkWeekdayEl = document.getElementById('clk-weekday');

let activeCell = null;
let H = 8, M = 0, focusHM = 'H';
let digits = { d1: 0, d2: 0, d3: 0, d4: 0 };
let editPos = 1;
let isEditing = false;
let ampmCycle = 0;
let lastDispHour = 12;

// --- Контекст на текущо отворения модал ---
let currentContext = {
  row: 0,
  dow: 0,
  productName: '',
  state: null,
  saveState: () => {},
  getIntakeStateForSlot: () => ({ status: 'normal', has: false }),
  toggleIntakeAt: () => {},
  normalizeColumnAfterChange: () => {},
  renderTimes: () => {},
  updateIntakeStates: () => {},
  blinkCell: () => {},
  blinkRow: () => {},
  refreshDays: () => {}
};

function setHands() {
  const d = hour24ToDisp(H);
  const degH = (d.disp % 12) * 30 + (M / 60) * 30;
  const degM = M * 6;
  if(handH) handH.style.transform = 'translate(-50%,-100%) rotate(' + degH + 'deg)';
  if(handM) handM.style.transform = 'translate(-50%,-100%) rotate(' + degM + 'deg)';
}
function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

function hour24ToDisp(h24) {
  if (h24 === 24) return { disp: 12, cycle: 1 };
  const cycle = (h24 >= 13) ? 1 : 0;
  const disp = ((h24 - 1) % 12) + 1;
  return { disp, cycle };
}
function dispToHour24(disp, cycle) {
  if (cycle === 0) return disp;
  return disp === 12 ? 24 : (disp + 12);
}
function recomputeAmpmFromTime() {
  ampmCycle = (H >= 13 || H === 24) ? 1 : 0;
  const d = hour24ToDisp(H);
  lastDispHour = d.disp;
}

function syncDigitsFromTime() {
  const hDisp = (H === 24 ? 0 : H);
  const hs = two(hDisp);
  const ms = two(M);
  digits.d1 = parseInt(hs[0], 10) || 0;
  digits.d2 = parseInt(hs[1], 10) || 0;
  digits.d3 = parseInt(ms[0], 10) || 0;
  digits.d4 = parseInt(ms[1], 10) || 0;
}

function renderDigits() {
  if (!readBox) return;
  const map = { 1: digits.d1, 2: digits.d2, 3: digits.d3, 4: digits.d4 };
  for (let pos = 1; pos <= 4; pos++) {
    const span = readBox.querySelector('.clk-digit[data-pos="' + pos + '"]');
    if (!span) continue;
    span.textContent = String(map[pos]);
    span.classList.toggle('active', isEditing && pos === editPos);
  }
}

function updateRead() { renderDigits(); }

function buildHours() {
  if(!ringH) return;
  clear(ringH);
  for (let i = 1; i <= 12; i++) {
    const el = document.createElement('div');
    el.className = 'clk-tick hour' + ((i === 12 || i === 3 || i === 6 || i === 9) ? ' strong' : '');
    el.dataset.disp = String(i);
    el.textContent = toRoman(i);

    const ang = (Math.PI * 2) * (i % 12) / 12 - Math.PI / 2;
    const R = 76;
    const SIZE = 30;
    const x = Math.cos(ang) * R, y = Math.sin(ang) * R;
    el.style.width = SIZE + 'px';
    el.style.height = SIZE + 'px';
    el.style.left = 'calc(50% + ' + (x - SIZE / 2) + 'px)';
    el.style.top = 'calc(50% + ' + (y - SIZE / 2) + 'px)';

    const h24 = dispToHour24(i, ampmCycle);
    if (h24 === H) el.classList.add('sel');

    el.addEventListener('click', () => {
      H = dispToHour24(i, ampmCycle);
      recomputeAmpmFromTime();
      syncDigitsFromTime(); updateRead(); setHands();
      buildHours();
      focusHM = 'H';
    });

    ringH.appendChild(el);
  }
}

function refreshMinuteTicks() {
  const children = ringM ? Array.from(ringM.children) : [];
  children.forEach(el => {
    const m = parseInt(el.dataset.min, 10);
    if (!Number.isFinite(m)) return;
    const isMajor = (m % 5 === 0);
    el.classList.toggle('sel', m === M);
    if (isMajor) {
      el.textContent = (m === 0 ? "60" : two(m));
    } else {
      el.textContent = '·';
    }
  });
}

function buildMins() {
  if(!ringM) return;
  clear(ringM);
  for (let m = 0; m < 60; m++) {
    const isMajor = (m % 5 === 0);
    const isQuarter = (m === 0 || m === 15 || m === 30 || m === 45);

    let cls = 'clk-tick';
    if (isMajor) {
      cls += ' strong';
      if (isQuarter) cls += ' quarter';
    } else {
      cls += ' minor';
    }

    const el = document.createElement('div');
    el.className = cls;
    el.dataset.min = String(m);
    el.textContent = isMajor ? (m === 0 ? "60" : two(m)) : '·';

    const ang = (Math.PI * 2) * (m / 60) - Math.PI / 2;
    const R = isMajor ? 120 : 108;
    const size = isMajor ? 20 : 8;
    const x = Math.cos(ang) * R;
    const y = Math.sin(ang) * R;
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    el.style.left = 'calc(50% + ' + (x - size / 2) + 'px)';
    el.style.top = 'calc(50% + ' + (y - size / 2) + 'px)';

    el.addEventListener('click', () => {
      M = m;
      recomputeAmpmFromTime();
      syncDigitsFromTime(); updateRead(); setHands();
      refreshMinuteTicks();
      buildHours();
      focusHM = 'M';
    });

    ringM.appendChild(el);
  }
  refreshMinuteTicks();
}

function commitDigitsToTime() {
  const hourCandidate = digits.d1 * 10 + digits.d2;
  const minCandidate = digits.d3 * 10 + digits.d4;
  if (hourCandidate > 24 || minCandidate > 60) return;

  let newH = (hourCandidate === 0 ? 24 : hourCandidate);
  let newM = (minCandidate === 60 ? 0 : minCandidate);

  H = newH; M = newM;

  syncDigitsFromTime(); recomputeAmpmFromTime(); updateRead();
  setHands(); buildMins(); buildHours();
}

function validateOnMove(oldPos, newPos) {
  const hourCandidate = digits.d1 * 10 + digits.d2;
  const minCandidate = digits.d3 * 10 + digits.d4;
  const invalidHour = hourCandidate > 24;
  const invalidMin = minCandidate > 60;
  const movingWithinHour = ((oldPos === 1 && newPos === 2) || (oldPos === 2 && newPos === 1));
  const leavingHour = (oldPos === 1 || oldPos === 2) && !(newPos === 1 || newPos === 2);

  if (movingWithinHour || leavingHour) {
    if (!invalidHour && !invalidMin) { commitDigitsToTime(); } 
    else if (invalidHour) {
      const hDisp = (H === 24 ? 0 : H); const hs = two(hDisp);
      digits.d1 = parseInt(hs[0], 10) || 0; digits.d2 = parseInt(hs[1], 10) || 0;
    }
  }
  const movingWithinMin = ((oldPos === 3 && newPos === 4) || (oldPos === 4 && newPos === 3));
  const leavingMin = (oldPos === 3 || oldPos === 4) && !(newPos === 3 || newPos === 4);
  if (movingWithinMin || leavingMin) {
    if (!invalidHour && !invalidMin) { commitDigitsToTime(); } 
    else if (invalidMin) {
      const ms = two(M);
      digits.d3 = parseInt(ms[0], 10) || 0; digits.d4 = parseInt(ms[1], 10) || 0;
    }
  }
}

function setEditPos(newPos) {
  const oldPos = editPos;
  const clamped = Math.max(1, Math.min(4, newPos));
  if (oldPos !== clamped) { validateOnMove(oldPos, clamped); }
  editPos = clamped;
  renderDigits();
}
function handleDigitCell(d) {
  if (d < 0 || d > 9) return;
  if (editPos === 1) { digits.d1 = d; } 
  else if (editPos === 2) { digits.d2 = d; } 
  else if (editPos === 3) { digits.d3 = d; } 
  else if (editPos === 4) { digits.d4 = d; }
  commitDigitsToTime();
  if (editPos < 4) setEditPos(editPos + 1);
}
function handleBackspaceCell() {
  if (editPos === 1) digits.d1 = 0;
  else if (editPos === 2) digits.d2 = 0;
  else if (editPos === 3) digits.d3 = 0;
  else if (editPos === 4) digits.d4 = 0;
  commitDigitsToTime();
}

function hideClk() {
  if(Modal) {
      Modal.classList.remove('show');
      Modal.setAttribute('aria-hidden', 'true');
  }
  document.body.style.overflow = '';
  if (activeCell) { activeCell.classList.remove('sel'); activeCell = null; }
  stopEditing();
  // Нулираме контекста, след като е затворен
  currentContext = {
    row: 0, dow: 0, productName: '', state: null, saveState: () => {},
    getIntakeStateForSlot: () => ({ status: 'normal', has: false }),
    toggleIntakeAt: () => {}, normalizeColumnAfterChange: () => {},
    renderTimes: () => {}, updateIntakeStates: () => {},
    blinkCell: () => {}, blinkRow: () => {}, refreshDays: () => {}
  };
}

function handleTimeKey(ev) {
  if (!isEditing) return;
  if (ev.ctrlKey || ev.metaKey) return;
  const k = ev.key;
  if (k === 'Tab' || k === 'Shift' || k === 'Alt' || k.startsWith('F')) return;
  if (k === 'ArrowLeft') { ev.preventDefault(); setEditPos(editPos - 1); return; }
  if (k === 'ArrowRight') { ev.preventDefault(); setEditPos(editPos + 1); return; }
  if (k === 'ArrowUp' || k === 'ArrowDown') {
    ev.preventDefault();
    const dir = (k === 'ArrowUp') ? 1 : -1;
    if (focusHM === 'H') {
      const prevH = H;
      if (dir > 0) { H = (H === 24) ? 1 : (H + 1); } else { H = (H === 1) ? 24 : (H - 1); }
      if ((prevH === 12 && H === 13) || (prevH === 13 && H === 12) || (prevH === 24 && H === 1) || (prevH === 1 && H === 24)) {
        ampmCycle = 1 - ampmCycle;
      }
      recomputeAmpmFromTime();
      syncDigitsFromTime(); updateRead(); setHands(); buildHours();
    } else {
      const prev = M;
      if (dir > 0) {
        if (prev === 59) { M = 0; H = (H === 24) ? 1 : (H + 1); } else { M = prev + 1; }
      } else {
        if (prev === 0) { M = 59; H = (H === 1) ? 24 : (H - 1); } else { M = prev - 1; }
      }
      recomputeAmpmFromTime();
      syncDigitsFromTime(); updateRead(); setHands();
      buildMins(); buildHours();
    }
    return;
  }
  if (k === 'Backspace' || k === 'Delete') { ev.preventDefault(); handleBackspaceCell(); return; }
  if (k === 'Enter') { ev.preventDefault(); return; }
  if (k === 'Escape') { ev.preventDefault(); hideClk(); return; }
  if (k >= '0' && k <= '9') { ev.preventDefault(); handleDigitCell(parseInt(k, 10)); return; }
  ev.preventDefault();
}

function ptAngle(cx, cy, x, y) {
  const dx = x - cx, dy = y - cy;
  let ang = Math.atan2(dy, dx);
  ang += Math.PI / 2;
  if (ang < 0) ang += Math.PI * 2;
  return ang;
}
function angleToDispHour(ang) {
  let frac = ang / (Math.PI * 2);
  let idx = Math.round(frac * 12) % 12;
  let disp = idx === 0 ? 12 : idx;
  return disp;
}

let dragging = null;

function setFromAngleHours(ang) {
  const disp = angleToDispHour(ang);
  const prev = lastDispHour;
  if (disp !== prev) {
    if ((prev === 12 && disp === 1) || (prev === 1 && disp === 12)) {
      ampmCycle = 1 - ampmCycle;
    }
    lastDispHour = disp;
  }
  H = dispToHour24(disp, ampmCycle);
  recomputeAmpmFromTime();
  syncDigitsFromTime(); updateRead(); setHands();
  buildHours();
  focusHM = 'H';
}

function setFromAngleMins(ang) {
  let v = Math.round((ang / (Math.PI * 2)) * 60) % 60; if (v < 0) v += 60;
  const prev = M;
  if (prev === 59 && v === 0) { H = (H === 24) ? 1 : (H + 1); } 
  else if (prev === 0 && v === 59) { H = (H === 1) ? 24 : (H - 1); }
  M = v;
  recomputeAmpmFromTime();
  syncDigitsFromTime(); updateRead(); setHands();
  refreshMinuteTicks();
  buildHours();
  focusHM = 'M';
}

function handleMove(e) {
  if (!dragging) return;
  const rect = face.getBoundingClientRect();
  const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
  const pt = e.touches ? e.touches[0] : e;
  const ang = ptAngle(cx, cy, pt.clientX, pt.clientY);
  if (dragging === 'H') setFromAngleHours(ang);
  else setFromAngleMins(ang);
}
function startDrag(which, e) { dragging = which; handleMove(e); }
function endDrag() { dragging = null; }

if(ringH) {
  ringH.addEventListener('pointerdown', (e) => { e.preventDefault(); startDrag('H', e); });
  ringH.addEventListener('touchstart', (e) => { startDrag('H', e); }, { passive: false });
}
if(ringM) {
  ringM.addEventListener('pointerdown', (e) => { e.preventDefault(); startDrag('M', e); });
  ringM.addEventListener('touchstart', (e) => { startDrag('M', e); }, { passive: false });
}
window.addEventListener('pointermove', handleMove, { passive: false });
window.addEventListener('pointerup', endDrag);
window.addEventListener('touchmove', handleMove, { passive: false });
window.addEventListener('touchend', endDrag);

function startEditing(pos) {
  isEditing = true;
  if (readBox) readBox.classList.add('editing');
  if (typeof pos === "number") setEditPos(pos);
  else renderDigits();
  if (keyInput) {
    keyInput.value = "";
    keyInput.focus();
  }
}
function stopEditing() {
  if (isEditing) {
    const hourCandidate = digits.d1 * 10 + digits.d2;
    const minCandidate = digits.d3 * 10 + digits.d4;
    if (hourCandidate <= 24 && minCandidate <= 60) {
      commitDigitsToTime();
    } else {
      syncDigitsFromTime();
      updateRead();
    }
  }
  isEditing = false;
  if (readBox) readBox.classList.remove('editing');
  renderDigits();
  if (keyInput) {
    keyInput.blur();
    keyInput.value = "";
  }
}

if (readBox) {
  readBox.addEventListener('click', (ev) => {
    if (!readBox) return;
    const digitSpan = ev.target.closest('.clk-digit');
    const pos = digitSpan ? (Number(digitSpan.getAttribute('data-pos')) || editPos) : editPos;
    if (!isEditing) {
      startEditing(pos);
    } else {
      setEditPos(pos);
      if (keyInput) { keyInput.focus(); }
    }
  });
  readBox.addEventListener('paste', (e) => {
    if (!isEditing) return;
    const txt = (e.clipboardData && e.clipboardData.getData('text')) || "";
    if (!txt) return;
    e.preventDefault();
    const nums = txt.replace(/\D+/g, "");
    for (const ch of nums) {
      const d = ch.charCodeAt(0) - 48;
      if (d >= 0 && d <= 9) handleDigitCell(d);
    }
  });
}
if (keyInput) {
  keyInput.addEventListener('keydown', handleTimeKey);
  keyInput.addEventListener('input', () => {
    if (!isEditing) { keyInput.value = ""; return; }
    const txt = keyInput.value || "";
    keyInput.value = "";
    const nums = txt.replace(/\D+/g, "");
    for (const ch of nums) {
      const d = ch.charCodeAt(0) - 48;
      if (d >= 0 && d <= 9) handleDigitCell(d);
    }
  });
}
document.addEventListener('click', (e) => {
  if (!isEditing) return;
  if (readBox && readBox.contains(e.target)) return;
  if (e.target === keyInput) return;
  stopEditing();
});

if(Modal) Modal.addEventListener('click', (e) => { if (e.target === Modal) hideClk(); });

// --- Функции, управлявани от контекст ---

function applyTimeForCurrentCell(normalizeAllDays) {
  const { state, row, dow, normalizeColumnAfterChange } = currentContext;
  const idx = (dow === 0 ? 6 : dow - 1);
  const hSave = (H === 24 ? 0 : H);
  const newMinutes = hSave * 60 + M;

  if (normalizeAllDays) {
    for (let d = 0; d < 7; d++) {
      normalizeColumnAfterChange(row, d, newMinutes);
    }
  } else {
    normalizeColumnAfterChange(row, idx, newMinutes);
  }
}

function handleSaveOne() {
  applyTimeForCurrentCell(false);
  const { state, saveState, renderTimes, blinkCell, row, dow } = currentContext;
  saveState(state);
  renderTimes();
  if(window.masterUpdateAllGrids) window.masterUpdateAllGrids();
  blinkCell(row, dow);
  hideClk();
}

function handleSaveAllDays() {
  applyTimeForCurrentCell(true);
  const { state, saveState, renderTimes, blinkRow, row } = currentContext;
  saveState(state);
  renderTimes();
  if(window.masterUpdateAllGrids) window.masterUpdateAllGrids();
  blinkRow(row);
  hideClk();
}

function handleAudioToggle() {
  const { state, saveState, row, dow, renderTimes, blinkCell } = currentContext;
  const idx = (dow === 0 ? 6 : dow - 1);
  applyTimeForCurrentCell(false); // Запазваме часа, преди да сменим флага

  const cur = (state.flag[row] && state.flag[row][idx]) | 0;
  const next = (cur === 2 ? 0 : 2);
  state.flag[row][idx] = next;

  saveState(state);
  renderTimes();
  if(window.masterUpdateAllGrids) window.masterUpdateAllGrids();
  updateAudioButtonForCurrent(); 
  blinkCell(row, dow);
  hideClk();
}

function handleIntake() {
  const { toggleIntakeAt, blinkCell, row, dow } = currentContext;
  const nowDone = toggleIntakeAt(row, dow);
  if(window.masterUpdateAllGrids) window.masterUpdateAllGrids();
  updateIntakeButtonForCurrent(); 
  if (nowDone) {
    blinkCell(row, dow);
  }
}

if(btnSaveOne) btnSaveOne.addEventListener('click', handleSaveOne);
if(btnSaveAll) btnSaveAll.addEventListener('click', handleSaveAllDays);
if(btnAudio) btnAudio.addEventListener('click', handleAudioToggle);
if(btnIntake) btnIntake.addEventListener('click', handleIntake);

// --- НОВО: Listener за затваряне от X ---
if(btnClose) btnClose.addEventListener('click', hideClk);

function updateIntakeButtonForCurrent() {
  if (!btnIntake) return;
  const { getIntakeStateForSlot, row, dow } = currentContext;
  btnIntake.classList.remove('upcoming', 'overdue', 'done', 'solid');
  const { status } = getIntakeStateForSlot(row, dow);
  if (status === 'upcoming') btnIntake.classList.add('upcoming');
  else if (status === 'overdue') btnIntake.classList.add('overdue');
  else if (status === 'done') { btnIntake.classList.add('done'); }
}

function updateAudioButtonForCurrent() {
  if (!btnAudio) return;
  const { state, row, dow } = currentContext;
  btnAudio.classList.remove('on', 'off');
  const idx = (dow === 0 ? 6 : dow - 1);
  const f = (state.flag[row] && state.flag[row][idx]) | 0;
  if (f === 2) btnAudio.classList.add('off');
  else btnAudio.classList.add('on');
}

// --- Публичен API (ЕКСПОРТ) ---
export const ModalLogic = {
  showClk: function(row, dow, initial, cell, gridContext) {
    if (activeCell) activeCell.classList.remove('sel');
    activeCell = cell; 
    if (activeCell) activeCell.classList.add('sel');

    currentContext = {
      row: row,
      dow: dow,
      ...gridContext
    };
    
    const { state, productName } = currentContext;

    if(window.syncActiveDow) window.syncActiveDow(dow);
    if(gridContext.refreshDays) gridContext.refreshDays();

    if (clkProductEl) {
      clkProductEl.textContent = productName;
    }
    if (clkWeekdayEl) {
      var names = ['неделя', 'понеделник', 'вторник', 'сряда', 'четвъртък', 'петък', 'събота'];
      var w = (dow >= 0 && dow < names.length) ? names[dow] : "";
      clkWeekdayEl.textContent = w;
    }

    const idx = (dow === 0 ? 6 : dow - 1);
    const parts = (initial || state.times[row][idx]).split(':');
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);

    let hh = isFinite(h) ? h : 8;
    if (hh === 0) hh = 24;
    H = hh;
    M = isFinite(m) ? m : 0;
    focusHM = 'H';

    recomputeAmpmFromTime();
    syncDigitsFromTime();
    editPos = 1;
    stopEditing();
    updateRead();
    setHands();
    buildHours(); buildMins();

    updateIntakeButtonForCurrent();
    updateAudioButtonForCurrent();

    if(Modal) {
        Modal.classList.add('show');
        Modal.setAttribute('aria-hidden', 'false');
    }
    document.body.style.overflow = 'hidden';
  }
};