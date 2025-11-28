/*
 * PROGRAM EXTRA
 * Логика за конфигурируеми продукти (Берберин) и допълнителни настройки.
 */

window.APP = window.APP || {};

APP.progExtra = {
  config: {
    berberine: {
      active: true,
      brand: 'thorne',
      customName: '',
      dailyCount: 3,
      times: ['08:00', '13:00', '19:00', '21:00', '22:00', '23:00'] // Pool от времена
    }
  },
  
  init: function() {
    this.initBerberine();
    // Тук могат да се инициализират и Glucomannan / EGCg по подобен начин
  },
  
  initBerberine: function() {
    const container = APP.dom.get('ber-block');
    const head = APP.dom.get('ber-head');
    const configPanel = APP.dom.get('ber-config');
    const gridContainer = APP.dom.get('ber-grid-container');
    
    // Toggle Config Panel
    APP.dom.listen(head, 'click', () => {
      const isHidden = configPanel.style.display === 'none';
      configPanel.style.display = isHidden ? 'flex' : 'none';
    });
    
    // Brand Selection
    const brandSel = APP.dom.get('ber-brand-select');
    APP.dom.listen(brandSel, 'change', () => {
      const val = brandSel.value;
      if (val === 'custom') {
        APP.dom.show(APP.dom.get('ber-custom-name-field'));
      } else {
        APP.dom.hide(APP.dom.get('ber-custom-name-field'));
      }
      this.updateBerberineUI();
    });
    
    // Slider
    const slider = APP.dom.get('ber-slider');
    const sliderVal = APP.dom.get('ber-slider-val');
    APP.dom.listen(slider, 'input', () => {
      sliderVal.textContent = slider.value;
      this.config.berberine.dailyCount = parseInt(slider.value);
    });
    
    // Save Button
    APP.dom.listen(APP.dom.get('ber-save'), 'click', () => {
      this.renderBerberineGrid();
      configPanel.style.display = 'none';
      APP.dom.show(gridContainer);
    });
    
    // Initial Render
    this.updateBerberineUI();
  },
  
  updateBerberineUI: function() {
    // Смяна на картинка/име според избрания бранд
    const brandSel = APP.dom.get('ber-brand-select');
    const capBrand = APP.dom.get('ber-cap-brand');
    
    // Примерна логика
    if (brandSel.value !== 'custom') {
      capBrand.textContent = brandSel.options[brandSel.selectedIndex].text;
    } else {
      capBrand.textContent = "(Custom)";
    }
  },
  
  renderBerberineGrid: function() {
    const count = this.config.berberine.dailyCount;
    const gridContainer = APP.dom.get('ber-grid-container');
    
    // Генериране на динамична таблица
    let html = `<table class="pl-table"><thead><tr>`;
    // Хедъри... (за краткост копираме структурата)
    html += `<th class="pl-day">Пн</th><th class="pl-day">Вт</th><th class="pl-day">Ср</th><th class="pl-day">Чт</th><th class="pl-day">Пт</th><th class="pl-day weekend">Сб</th><th class="pl-day weekend">Нд</th>`;
    html += `</tr></thead><tbody>`;
    
    for(let i=0; i<count; i++) {
      html += `<tr>`;
      for(let d=0; d<7; d++) {
        html += `<td class="pl-time-cell">08:00</td>`; // Default time placeholder
      }
      html += `</tr>`;
    }
    html += `</tbody></table>`;
    
    gridContainer.innerHTML = html;
    
    // Трябва да се bind-нат клик ивентите към новите клетки, 
    // най-добре е да се ползва APP.grid.initTable(), но тя иска съществуващ ID на таблица.
    // Затова тук просто inject-ваме HTML и след това може да викаме helper.
  }
};