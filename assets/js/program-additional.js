/* global createProductGrid, ModalLogic */ // Информираме, че тези идват от други файлове

(function() {
  "use strict";

  // Дефиниции на часовете по подразбиране (0-6)
  const DEFAULT_TIMES_MAP = [
    [], // 0
    [["12:00"]], // 1
    [["08:00"], ["19:00"]], // 2
    [["08:00"], ["13:00"], ["19:00"]], // 3
    [["08:00"], ["12:00"], ["16:00"], ["19:00"]], // 4
    [["08:00"], ["10:00"], ["12:00"], ["16:00"], ["19:00"]], // 5
    [["08:00"], ["10:00"], ["12:00"], ["14:00"], ["16:00"], ["19:00"]] // 6
  ];

  /**
   * Създава логиката за един "Допълнителен" продукт
   * @param {string} prefix - Уникален префикс (npr. 'ber' за Берберин)
   */
  function createConfigurableProduct(prefix) {
    const enableCheck = document.getElementById(`${prefix}-enable`);
    const configDiv = document.getElementById(`${prefix}-config`);
    const nameInput = document.getElementById(`${prefix}-name`);
    const slider = document.getElementById(`${prefix}-slider`);
    const sliderVal = document.getElementById(`${prefix}-slider-val`);
    const saveBtn = document.getElementById(`${prefix}-save`);
    const gridContainer = document.getElementById(`${prefix}-grid-container`);
    const block = document.getElementById(`${prefix}-block`);
    const cap = block.querySelector('.prog-cap'); // Заглавието в `prog-head`
    
    // Ако елементите ги няма, излизаме
    if (!enableCheck || !configDiv || !slider || !saveBtn || !gridContainer) {
      console.error(`Липсващи елементи за ${prefix}`);
      return;
    }
    
    const STORAGE_KEY = `bt_add_${prefix}_v310`; // Ключ за localStorage

    let currentGridInstance = null; // Тук пазим инстанцията на "умната" мрежа

    // 1. Зареждаме запазените настройки
    let settings = {
      enabled: false,
      name: nameInput.placeholder,
      rows: 0
    };
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved) {
        settings = saved;
      }
    } catch (e) {}

    // 2. Прилагаме заредените настройки при старт
    enableCheck.checked = settings.enabled;
    nameInput.value = settings.name || nameInput.placeholder;
    slider.value = settings.rows;
    sliderVal.textContent = settings.rows;
    if (cap) {
      cap.textContent = settings.name || nameInput.placeholder;
    }
    if (settings.enabled) {
      // Ако е активен, генерираме таблицата веднага
      generateGrid(settings.rows, settings.name);
    }

    // 3. Свързваме плъзгача с етикета
    slider.addEventListener('input', () => {
      sliderVal.textContent = slider.value;
    });

    // 4. Свързваме бутона "Запази"
    saveBtn.addEventListener('click', () => {
      const newRows = parseInt(slider.value, 10);
      const newName = nameInput.value.trim() || nameInput.placeholder;

      // Запазваме новите настройки
      settings.enabled = enableCheck.checked;
      settings.rows = newRows;
      settings.name = newName;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      
      // Актуализираме заглавието веднага
      if (cap) {
        cap.textContent = newName;
      }

      // Генерираме мрежата
      generateGrid(newRows, newName);
    });
    
    // 5. Показваме/скриваме приемите, ако се цъкне "изключване"
    enableCheck.addEventListener('change', () => {
      if (!enableCheck.checked) {
        // Ако го изключваме, трием мрежата и запазваме
        settings.enabled = false;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        if (currentGridInstance) {
          currentGridInstance.destroy(); // (Ще трябва да добавим .destroy() метод)
          currentGridInstance = null;
        }
        gridContainer.innerHTML = ""; // Трием таблицата
      }
    });


    /**
     * Генерира HTML-а за таблицата и я инициализира
     */
    function generateGrid(rowCount, productName) {
      // Ако вече има мрежа, я "убиваме" преди да създадем нова
      if (currentGridInstance) {
        currentGridInstance.destroy();
        currentGridInstance = null;
      }
      
      if (rowCount === 0) {
        gridContainer.innerHTML = ""; // Изчистваме, ако са избрани 0 приеми
        return;
      }

      // Генерираме default times (7 дни в седмицата)
      let defaultTimes = [];
      const timesMap = DEFAULT_TIMES_MAP[rowCount] || [];
      for(let i = 0; i < rowCount; i++) {
        const time = (timesMap[i] && timesMap[i][0]) || "12:00"; // Резервен час
        defaultTimes.push(Array(7).fill(time));
      }

      const tableId = `${prefix}-table`;
      const buttonId = `btnProgIntake${prefix.toUpperCase()}`;
      
      // Генерираме HTML за таблицата
      let tbodyHtml = '';
      for (let r = 0; r < rowCount; r++) {
        tbodyHtml += '<tr>';
        for (let d = 1; d <= 7; d++) { // 1=Пн ... 7=Нд(0)
          const dow = (d === 7) ? 0 : d;
          tbodyHtml += `<td class="pl-time-cell" data-row="${r}" data-dow="${dow}">${defaultTimes[r][dow === 0 ? 6 : dow - 1]}</td>`;
        }
        tbodyHtml += '</tr>';
      }

      gridContainer.innerHTML = `
        <table class="pl-table" id="${tableId}">
          <thead>
            <tr>
              <th class="pl-day" data-dow="1">Пн</th>
              <th class="pl-day" data-dow="2">Вт</th>
              <th class="pl-day" data-dow="3">Ср</th>
              <th class="pl-day" data-dow="4">Чт</th>
              <th class="pl-day" data-dow="5">Пт</th>
              <th class="pl-day weekend" data-dow="6">Сб</th>
              <th class="pl-day weekend" data-dow="0">Нд</th>
            </tr>
          </thead>
          <tbody>
            ${tbodyHtml}
          </tbody>
        </table>
      `;

      // Инициализираме "умната" мрежа за тази НОВА таблица
      // (Трябва да изчакаме DOM-а да се обнови)
      setTimeout(() => {
        currentGridInstance = createProductGrid({
          tableId: tableId,
          buttonId: buttonId,
          storageKey: `bt_grid_${prefix}_v310`, // Отделен storage за *данните* от мрежата
          defaultTimes: defaultTimes,
          productName: productName,
          blockId: `${prefix}-block`
        });
        
        // Добавяме новата инстанция към глобалния списък за ъпдейти
        if (window.grids) {
          window.grids.push(currentGridInstance);
        }
      }, 0);
    }
  }

  // Инициализираме и трите конфигуратора
  createConfigurableProduct('ber'); // Берберин
  createConfigurableProduct('glu'); // Глюкоманан
  createConfigurableProduct('egc'); // EGCg

})();