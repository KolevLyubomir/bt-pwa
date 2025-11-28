/*
 * PROGRAM BASIC
 * Инициализация на основните продукти (ProLact, Omni, Chitosan).
 */

window.APP = window.APP || {};

APP.progBasic = {
  init: function() {
    // Дефиниране на графици (редове)
    // ProLact: 2 приема (сутрин, вечер)
    this.initProduct('pl-table', ['08:00', '19:00'], 'prolact');
    
    // Omni-Biotic: 1 прием (обяд)
    this.initProduct('he-table', ['12:00'], 'omni');
    
    // Chitosan: 3 приема
    this.initProduct('ch-table', ['08:00', '12:00', '19:00'], 'chitosan');
    
    this.bindHeaderButtons();
  },

  initProduct: function(tableId, defaultTimes, storageKeySuffix) {
    // Опит за зареждане на запазени данни от localStorage
    // За простота в това демо, ползваме само defaultTimes за инициализация на грида
    // В реално приложение тук бихме чели APP.config.storageKeyProg
    
    APP.grid.initTable(tableId, defaultTimes, (row, dow, time, mode) => {
      console.log(`Updated ${storageKeySuffix}: Row ${row}, Dow ${dow} to ${time} (${mode})`);
      // Тук трябва да се запише в localStorage
    });
  },
  
  bindHeaderButtons: function() {
    // Бутоните до заглавията (за бърз прием)
    const btnPL = APP.dom.get('btnProgIntakePL');
    const btnHE = APP.dom.get('btnProgIntakeHE');
    const btnCH = APP.dom.get('btnProgIntakeCH');
    
    if(btnPL) {
        btnPL.style.display = 'inline-flex'; // Показваме ги
        btnPL.addEventListener('click', () => this.toggleIntake('prolact'));
    }
    // ... analogichno za drugite
  },
  
  toggleIntake: function(product) {
    alert('Маркиран прием за ' + product);
    // Логика за смяна на иконата/класа на бутона
  }
};