/*
 * APP CORE
 * Основни настройки, навигация (табове) и помощни функции.
 */

window.APP = window.APP || {};

// Глобални настройки
APP.config = {
  version: '5.0.0',
  storageKeyData: 'bt_weight_data_v1',
  storageKeyProg: 'bt_program_state_v1',
  colors: {
    primary: '#22c55e',
    danger: '#ef4444',
    bg: '#0b1215'
  }
};

// Помощни функции за DOM
APP.dom = {
  get: (id) => document.getElementById(id),
  q: (sel) => document.querySelector(sel),
  qa: (sel) => document.querySelectorAll(sel),
  listen: (el, event, handler) => {
    if (el) el.addEventListener(event, handler);
  },
  show: (el) => { if(el) el.style.display = ''; },
  hide: (el) => { if(el) el.style.display = 'none'; }
};

// Управление на Табовете
APP.tabs = {
  init: function() {
    const tabData = APP.dom.get('tab-data');
    const tabProg = APP.dom.get('tab-program');
    
    APP.dom.listen(tabData, 'click', () => this.switch('panel-data'));
    APP.dom.listen(tabProg, 'click', () => this.switch('panel-program'));
  },
  
  switch: function(panelId) {
    // Скриване на всички панели
    document.querySelectorAll('.tabpanel').forEach(p => {
      p.setAttribute('aria-hidden', 'true');
      p.style.display = 'none';
    });
    
    // Деактивиране на всички бутони
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.setAttribute('aria-selected', 'false');
    });
    
    // Показване на избрания
    const panel = APP.dom.get(panelId);
    if (panel) {
      panel.setAttribute('aria-hidden', 'false');
      panel.style.display = 'block';
    }
    
    // Активиране на бутона
    const btnId = panelId === 'panel-data' ? 'tab-data' : 'tab-program';
    const btn = APP.dom.get(btnId);
    if (btn) btn.setAttribute('aria-selected', 'true');
    
    // Опресняване на съдържанието ако е нужно
    if (panelId === 'panel-data' && APP.data && APP.data.renderChart) {
      APP.data.renderChart();
    }
  }
};

// Initializer
document.addEventListener('DOMContentLoaded', () => {
  // Инициализиране на табовете
  APP.tabs.init();
  
  // Стартиране на отделните модули, ако са заредени
  if (APP.data && APP.data.init) APP.data.init();
  if (APP.clock && APP.clock.init) APP.clock.init();
  if (APP.progBasic && APP.progBasic.init) APP.progBasic.init();
  if (APP.progExtra && APP.progExtra.init) APP.progExtra.init();
  
  console.log(`BT App v${APP.config.version} started.`);
});