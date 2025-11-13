/* global createProductGrid */ // Информираме, че createProductGrid идва от друг файл

/**
 * =================================================================
 * ИНИЦИАЛИЗАЦИЯ НА МРЕЖИТЕ И ГЛОБАЛНИЯ ИНТЕРВАЛ
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

  // Създаваме 3-те инстанции
  const grids = [
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
    grids.forEach(grid => {
      // Проверяваме дали grid.state съществува, преди да го достъпим
      if (grid && grid.state && grid.state.activeDow !== dow) {
        grid.state.activeDow = dow;
        grid.saveState(grid.state);
        grid.refreshDays();
      }
    });
  };

  // --- Глобална функция за ъпдейт (извиква се от Модала) ---
  window.masterUpdateAllGrids = function() {
    grids.forEach(grid => grid.updateIntakeStates());
    checkAndScrollForOverdue();
  };

  
  // ===================================
  // --- КОРИГИРАНА ЛОГИКА ЗА ФОКУС (v3.1.2) ---
  // ===================================

  // Взимаме елементите на хедъра веднъж
  const topbarWrap = document.querySelector('.topbar-wrap');
  
  function checkAndScrollForOverdue() {
    let blockToScroll = null;
    
    // 1. Намираме ПЪРВИЯ просрочен продукт (ProLact -> OMNI -> Chitosan)
    for (const grid of grids) {
      if (grid.isOverdue()) {
        blockToScroll = grid.getBlockId();
        break; 
      }
    }

    // 2. Ако има просрочен, скролваме до него
    if (blockToScroll) {
      
      // Целта вече не е div-a, а .prog-head вътре в него.
      const block = document.getElementById(blockToScroll);
      const el = block ? block.querySelector('.prog-head') : null;

      if (el) {
        // 3. Изчисляваме колко място заема САМО горния бар (както поиска)
        const totalHeaderHeight = (topbarWrap ? topbarWrap.offsetHeight : 0);
        
        // 4. Това е позицията, на която искаме да е елементът (ТОЧНО под topbar)
        const expectedTopPosition = totalHeaderHeight;
        
        const rect = el.getBoundingClientRect();

        // 5. Скролваме САМО АКО вече не е на правилната позиция (даваме 5px толеранс)
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
  // ↑↑↑ КРАЙ НА ФИКС #1 ↑↑↑

  // --- Глобален Интервал ---
  function masterUpdateOnInterval() {
    grids.forEach(grid => grid.updateIntakeStates());
    checkAndScrollForOverdue();
  }

  setInterval(masterUpdateOnInterval, 60000); // 1 минута
  
  // Първоначално извикване
  setTimeout(masterUpdateOnInterval, 500); // Кратко забавяне, за да се зареди всичко

})();