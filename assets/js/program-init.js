/* global createProductGrid */ // Информираме, че createProductGrid идва от product-grid.js

/**
 * =================================================================
 * ИНИЦИАЛИЗАЦИЯ НА ОСНОВНИЯ ПАКЕТ И ГЛОБАЛНИЯ ИНТЕРВАЛ
 * =================================================================
 */
(function() {
  
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

  // Създаваме *глобален* масив, който `program-additional.js` ще може да допълва
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
  ].filter(g => g !== null); // Филтрираме, ако някоя таблица липсва

  
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
   * ПРОМЯНА (т.2): Синхронизира мигащите анимации (CSS animation-delay)
   * спрямо системния часовник.
   */
  function syncBlinkAnimation() {
    // Анимацията е 1000ms (1s).
    const period = 1000;
    const now = Date.now();
    // Изчисляваме колко време е минало от последната "кръгла" секунда
    // и задаваме отрицателно закъснение, за да "превъртим" анимацията до правилната фаза.
    const offset = -((now % period) / period); // число от -0.999 до 0
    document.documentElement.style.setProperty('--blink-offset', offset + 's');
  }

  // --- Глобална функция за ъпдейт (извиква се от Модала и бутоните) ---
  window.masterUpdateAllGrids = function() {
    syncBlinkAnimation(); // Синхронизираме при всяка интеракция
    window.grids.forEach(grid => grid.updateIntakeStates());
    checkAndScrollForOverdue();
  };

  
  // ===================================
  // --- ЛОГИКА ЗА ФОКУС (v3.1.2) ---
  // ===================================

  const topbarWrap = document.querySelector('.topbar-wrap');
  
  function checkAndScrollForOverdue() {
    let blockToScroll = null;
    
    // 1. Намираме ПЪРВИЯ просрочен продукт
    for (const grid of window.grids) {
      if (grid.isOverdue()) {
        blockToScroll = grid.getBlockId();
        break; 
      }
    }

    // 2. Ако има просрочен, скролваме до него
    if (blockToScroll) {
      const block = document.getElementById(blockToScroll);
      const el = block ? block.querySelector('.prog-head') : null; // Целим заглавието

      if (el) {
        // 3. Изчисляваме височината на topbar
        const totalHeaderHeight = (topbarWrap ? topbarWrap.offsetHeight : 0);
        
        // 4. Позиция (ТОЧНО под topbar)
        const expectedTopPosition = totalHeaderHeight;
        
        const rect = el.getBoundingClientRect();

        // 5. Скролваме САМО АКО вече не е на правилната позиция
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
    syncBlinkAnimation(); // Синхронизираме и при периодичния ъпдейт
    window.grids.forEach(grid => grid.updateIntakeStates());
    checkAndScrollForOverdue();
  }

  setInterval(masterUpdateOnInterval, 60000); // 1 минута
  
  // Първоначално извикване
  setTimeout(masterUpdateOnInterval, 500);

})();