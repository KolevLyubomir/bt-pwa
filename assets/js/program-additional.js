/* global createProductGrid, ModalLogic */ // Информираме, че тези идват от други файлове

(function() {
  "use strict";

  // Карта с данни за продуктите (снимки и имена)
  const BERBERINE_BRANDS = {
    "thorne": {
      name: "Thorne Research",
      img: "https://d1vo8zfysxy97v.cloudfront.net/media/product/sf800__vd424273289116ed602cb97bcef5ca314e2b9ff03.png"
    },
    "toniiq": {
      name: "Toniiq - Ultra High Strength",
      img: "https://www.toniiq.com/cdn/shop/products/Group1.jpg?v=1676931815&width=1920"
    },
    "it": {
      name: "Integrative Therapeutics",
      img: "https://integrativepro.com/cdn/shop/files/20251111_5c2ea8c7-0d0a-4f69-95a8-3fe9a5022893.png?v=1762870800"
    },
    "nutricost": {
      name: "Nutricost",
      img: "https://nutricost.com/cdn/shop/files/NTC_BerberineHCL_1200MG_60CAP_175CC_Front_Square_1800x1800.jpg?v=1738091804"
    },
    "now": {
      name: "NOW Foods - Berberine Glucose",
      img: "https://nowfoods.bg/image/cache/catalog/Berberine/Berberine%20-%202-350x350.webp"
    },
    "custom": {
      name: "Друга марка",
      img: "https://izgorimazninite.com/wp-content/uploads/2020/02/berberine-2.jpg" // Генерична
    }
  };

  // Дефиниции на часовете по подразбиране (0-6)
  // Индекс 0 вече не се ползва, тъй като плъзгачът е 1-6
  const DEFAULT_TIMES_MAP = [
    [], // 0
    [["12:00"]], // 1
    [["08:00"], ["19:00"]], // 2
    [["08:00"], ["13:00"], ["19:00"]], // 3
    [["08:00"], ["12:00"], ["16:00"], ["20:00"]], // 4
    [["07:00"], ["10:00"], ["13:00"], ["16:00"], ["19:00"]], // 5
    [["07:00"], ["10:00"], ["13:00"], ["16:00"], ["19:00"], ["22:00"]] // 6
  ];

  /**
   * Създава логиката за един "Допълнителен" продукт
   * @param {string} prefix - Уникален префикс (npr. 'ber' за Берберин)
   * @param {object} brandsMap - Обект с данните за марките
   */
  function createConfigurableProduct(prefix, brandsMap) {
    // --- Взимане на Елементи ---
    const configDiv = document.getElementById(`${prefix}-config`);
    const nameInput = document.getElementById(`${prefix}-name`);
    const slider = document.getElementById(`${prefix}-slider`);
    const sliderVal = document.getElementById(`${prefix}-slider-val`);
    const sliderTrackFill = document.getElementById(`${prefix}-slider-track-fill`);
    const saveBtn = document.getElementById(`${prefix}-save`);
    const deleteBtn = document.getElementById(`${prefix}-delete`);
    const gridContainer = document.getElementById(`${prefix}-grid-container`);
    const capMain = document.getElementById(`${prefix}-cap-main`); // Основно заглавие (Берберин)
    const capBrand = document.getElementById(`${prefix}-cap-brand`); // Под-заглавие (Марка)
    const head = document.getElementById(`${prefix}-head`);
    const brandSelect = document.getElementById(`${prefix}-brand-select`);
    const customNameField = document.getElementById(`${prefix}-custom-name-field`);
    const productImg = document.getElementById(`${prefix}-img`);
    const intakeBtn = document.getElementById(`btnProgIntake${prefix.toUpperCase()}`);
    
    if ( !configDiv || !slider || !saveBtn || !gridContainer || !head || !brandSelect) {
      console.error(`Липсващи елементи за ${prefix}`);
      return;
    }
    
    const STORAGE_KEY = `bt_add_${prefix}_v310`; // Ключ за localStorage

    let currentGridInstance = null; // Тук пазим инстанцията на "умната" мрежа

    // --- Настройки по подразбиране ---
    let settings = {
      brand: Object.keys(brandsMap)[0],
      customName: '',
      rows: 0 // 0 = неактивен
    };
    
    // --- 1. Зареждане от Паметта ---
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved) {
        settings = { ...settings, ...saved };
      }
    } catch (e) {}

    // --- 2. Прилагане на Настройките при Старт (UI функция) ---
    function updateUI(showConfig = false) {
      const isConfigured = settings.rows > 0;
      const brandKey = settings.brand || Object.keys(brandsMap)[0];
      const brandData = brandsMap[brandKey] || brandsMap["custom"];
      let currentName = brandData.name;

      // A. Попълваме панела с настройки
      brandSelect.value = brandKey;
      
      // ФИКС 3: Плъзгачът е 1-6, default 3
      if (isConfigured) {
        slider.value = settings.rows; // Ако е запазено, сложи запазената стойност
      } else {
        slider.value = 3; // Ако не е, сложи default 3
      }
      sliderVal.textContent = slider.value;
      updateSliderFill(); // Обновяваме зелената лента

      // Логика за показване на ръчно име
      if (brandKey === 'custom') {
        customNameField.style.display = 'block';
        nameInput.value = settings.customName || '';
        if(settings.customName) {
           currentName = settings.customName;
        } else {
           currentName = nameInput.placeholder;
        }
      } else {
        customNameField.style.display = 'none';
      }
      
      // Б. Конфигурираме видимата част (Хедъра)
      if (isConfigured) {
        productImg.src = brandData.img;
        productImg.style.display = 'block';
        capMain.classList.add('configured'); // ФИКС 2: Става СИВО
        capBrand.textContent = currentName; // ФИКС 2: Показва марката в БЯЛО
        gridContainer.style.display = 'block';
        
        if (!currentGridInstance) {
          generateGrid(settings.rows, currentName);
        }
      } else {
        // Продуктът е "Изключен"
        productImg.style.display = 'none';
        capMain.classList.remove('configured'); // ФИКС 1: Остава БЯЛО
        capBrand.textContent = ''; // ФИКС 5: Празно
        gridContainer.style.display = 'none';
        gridContainer.innerHTML = "";
        
        if (currentGridInstance) {
          window.grids = window.grids.filter(g => g !== currentGridInstance);
          currentGridInstance.destroy();
          currentGridInstance = null;
        }
      }
      
      configDiv.style.display = showConfig ? 'block' : 'none';
    }
    
    // Функция за плъзгача
    function updateSliderFill() {
      const min = slider.min;
      const max = slider.max;
      const val = slider.value;
      // Изчисляваме процента (1-6)
      const percentage = (val - min) / (max - min) * 100;
      if (sliderTrackFill) {
         sliderTrackFill.style.width = percentage + '%';
      }
    }

    // --- 3. Дефиниране на Event Listeners ---

    // (v4.1.8) ПРОМЯНА: Клик е заменен със "Задържане" (Long Press)
    let pressTimer = null;
    let isLongPress = false;
    const LONG_PRESS_DURATION = 500; // 500ms (стандартно)

    function startPress(e) {
      isLongPress = false;
      pressTimer = setTimeout(() => {
        isLongPress = true;
        // Това е "дългото натискане" - отваряме панела
        const isHidden = configDiv.style.display === 'none';
        configDiv.style.display = isHidden ? 'block' : 'none';
      }, LONG_PRESS_DURATION);
      e.preventDefault(); // Предотвратява drag на изображението
    }

    function cancelPress() {
      // Отменяме таймера, ако го има
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    }
    
    // Свързваме новите събития
    head.addEventListener('pointerdown', startPress);
    head.addEventListener('pointerup', cancelPress);
    head.addEventListener('pointerleave', cancelPress);

    // Спираме 'click', за да не се изпълни, ако е имало long press
    head.addEventListener('click', (e) => {
      if (isLongPress) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
    // --- Край на промяна v4.1.8 ---


    // Падащо меню за Марки
    brandSelect.addEventListener('change', () => {
      const selectedBrand = brandSelect.value;
      if (selectedBrand === 'custom') {
        customNameField.style.display = 'block';
      } else {
        customNameField.style.display = 'none';
      }
    });

    // Плъзгач
    slider.addEventListener('input', () => {
      sliderVal.textContent = slider.value;
      updateSliderFill();
    });

    // Бутон "Запази"
    saveBtn.addEventListener('click', () => {
      // ФИКС 3: Плъзгачът ВИНАГИ е 1-6
      const newRows = parseInt(slider.value, 10);
      const newBrand = brandSelect.value;
      const newCustomName = (newBrand === 'custom') ? nameInput.value.trim() : '';

      const needsGridUpdate = (newRows !== settings.rows) || 
                              (newBrand !== settings.brand) || 
                              (newCustomName !== settings.customName);

      settings.rows = newRows;
      settings.brand = newBrand;
      settings.customName = newCustomName;
      
      saveAndRerender(false, needsGridUpdate); // Запазваме и скриваме config
    });
    
    // Бутон "Изтрий"
    deleteBtn.addEventListener('click', () => {
      if (settings.rows === 0) { // Ако вече е 0, просто затвори
        configDiv.style.display = 'none';
        return;
      }
      
      // ФИКС 2 (confirm):
      if (!confirm("Ще изтриете ли избора?")) {
        return;
      }
      
      settings.rows = 0; // ФИКС 3: Това е "изтриването"
      settings.customName = '';
      
      saveAndRerender(false, true); // Запазваме, скриваме config и принуждаваме ъпдейт
    });

    // --- 4. Основни Функции ---

    function saveAndRerender(showConfig, needsGridUpdate) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      
      const brandData = brandsMap[settings.brand] || brandsMap["custom"];
      let currentName = brandData.name;
      if(settings.brand === 'custom' && settings.customName) {
        currentName = settings.customName;
      } else if (settings.brand === 'custom') {
        currentName = nameInput.placeholder;
      }

      if (needsGridUpdate) {
        generateGrid(settings.rows, currentName);
      }
      
      updateUI(showConfig);
      
      // ФИКС 4: "Ghost Button" - Викаме глобален ъпдейт ВЕДНАГА
      window.masterUpdateAllGrids();
    }

    /**
     * Генерира HTML-а за таблицата и я инициализира
     */
    function generateGrid(rowCount, productName) {
      if (currentGridInstance) {
        window.grids = window.grids.filter(g => g !== currentGridInstance);
        currentGridInstance.destroy();
        currentGridInstance = null;
      }
      
      if (rowCount === 0) {
        gridContainer.innerHTML = "";
        if (intakeBtn) {
          intakeBtn.style.display = 'none'; // ФИКС 4: Скриваме бутона веднага
        }
        return;
      }

      let defaultTimes = [];
      const timesMap = DEFAULT_TIMES_MAP[rowCount] || DEFAULT_TIMES_MAP[1];
      for(let i = 0; i < rowCount; i++) {
        const time = (timesMap[i] && timesMap[i][0]) || "12:00";
        defaultTimes.push(Array(7).fill(time));
      }

      const tableId = `${prefix}-table`;
      const buttonId = `btnProgIntake${prefix.toUpperCase()}`;
      
      let tbodyHtml = '';
      for (let r = 0; r < rowCount; r++) {
        tbodyHtml += '<tr>';
        for (let d = 1; d <= 7; d++) {
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

      setTimeout(() => {
        if (typeof createProductGrid !== 'function') {
          console.error("createProductGrid не е заредена!");
          return;
        }
        
        currentGridInstance = createProductGrid({
          tableId: tableId,
          buttonId: buttonId,
          storageKey: `bt_grid_${prefix}_v310`,
          defaultTimes: defaultTimes,
          productName: productName,
          blockId: `${prefix}-block`
        });
        
        if (window.grids && currentGridInstance) {
          window.grids.push(currentGridInstance);
          currentGridInstance.updateIntakeStates();
        }
      }, 0);
    }
    
    // --- 5. Първоначално стартиране ---
    updateUI(false); // Зареждаме UI, без да показваме config панела
  }

  // ===================================
  // --- ИНИЦИАЛИЗАЦИЯ ---
  // ===================================

  // Инициализираме само Берберин засега
  createConfigurableProduct('ber', BERBERINE_BRANDS); 
  
  // TODO: Инициализирай и 'glu' и 'egc' (засега са празни)
  // createConfigurableProduct('glu', {});
  // createConfigurableProduct('egc', {});

})();