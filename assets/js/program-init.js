import { createProductGrid } from './product-grid.js';

/**
 * =================================================================
 * ИНИЦИАЛИЗАЦИЯ НА ОСНОВНИЯ ПАКЕТ И ГЛОБАЛНИЯ ИНТЕРВАЛ
 * =================================================================
 */

// Дефиниции на часовете
const PL_DEFAULTS = [
  ["08:00", "08:00", "08:00", "08:00", "08:00", "08:00", "08:00"],
  ["19:00", "19:00", "19:00", "19:00", "19:00", "19:00", "19:00"]
];
const HE_DEFAULTS = [
  ["12:00", "12:00", "12:00", "12:00", "12:00", "12:00", "12:00"]
];
const CH_DEFAULTS = [
  ["08:00", "08:00", "08:00", "08:00", "08:00", "08:00", "08:00"],
  ["12:00", "12:00", "12:00", "12:00", "12:00", "12:00", "12:00"],
  ["19:00", "19:00", "19:00", "19:00", "19:00", "19:00", "19:00"]
];

// Създаваме *глобален* масив, който program-additional.js ще може да допълва.
// Тъй като modules са scoped, трябва изрично да го закачим за window,
// за да е достъпен между различните модули и конзолата.
window.grids = [
  createProductGrid({
    tableId: 'pl-table',
    buttonId: 'btnProgIntakePL',
    storageKey: 'bt_pl_grid_v310',
    defaultTimes: PL_DEFAULTS,
    productName: 'ProLact Slim+',
    blockId: 'prolact-block'
  }),
  createProductGrid({
    tableId: 'he-table',
    buttonId: 'btnProgIntakeHE',
    storageKey: 'bt_he_grid_v310',
    defaultTimes: HE_DEFAULTS,
    productName: 'OMNi-Biotic HETOX light',
    blockId: 'omni-block'
  }),
  createProductGrid({
    tableId: 'ch-table',
    buttonId: 'btnProgIntakeCH',
    storageKey: 'bt_ch_grid_v310',
    defaultTimes: CH_DEFAULTS,
    productName: 'Fortex Хитозан Плюс',
    blockId: 'chitosan-block'
  })
].filter(g => g !== null);


// --- Глобална синхронизация на DOW ---
window.syncActiveDow = function(dow) {
  window.grids.forEach(grid => {
    if (grid && grid.state && grid.state.activeDow !== dow) {
      grid.state.activeDow = dow;
      grid.saveState(grid.state);
      grid.refreshDays();
    }
  });
};

/**
 * Синхронизира мигащите анимации (CSS animation-delay)
 * спрямо системния часовник.
 */
function syncBlinkAnimation() {
  const period = 1000;
  const now = Date.now();
  const offset = -((now % period) / period); 
  document.documentElement.style.setProperty('--blink-offset', offset + 's');
}

// --- Глобална функция за ъпдейт ---
window.masterUpdateAllGrids = function() {
  syncBlinkAnimation(); 
  window.grids.forEach(grid => grid.updateIntakeStates());
  checkAndScrollForOverdue();
};


// ===================================
// --- ЛОГИКА ЗА ФОКУС (v3.1.2) ---
// ===================================

const topbarWrap = document.querySelector('.topbar-wrap');

function checkAndScrollForOverdue() {
  let blockToScroll = null;
  
  for (const grid of window.grids) {
    if (grid.isOverdue()) {
      blockToScroll = grid.getBlockId();
      break; 
    }
  }

  if (blockToScroll) {
    const block = document.getElementById(blockToScroll);
    const el = block ? block.querySelector('.prog-head') : null;

    if (el) {
      const totalHeaderHeight = (topbarWrap ? topbarWrap.offsetHeight : 0);
      const expectedTopPosition = totalHeaderHeight;
      const rect = el.getBoundingClientRect();

      if (Math.abs(rect.top - expectedTopPosition) > 5) {
        const targetScrollY = window.scrollY + rect.top - expectedTopPosition; 
        window.scrollTo({
          top: targetScrollY,
          behavior: 'smooth'
        });
      }
    }
  }
}

// --- Глобален Интервал ---
function masterUpdateOnInterval() {
  syncBlinkAnimation(); 
  window.grids.forEach(grid => grid.updateIntakeStates());
  checkAndScrollForOverdue();
}

setInterval(masterUpdateOnInterval, 60000); // 1 минута

// Първоначално извикване
setTimeout(masterUpdateOnInterval, 500);