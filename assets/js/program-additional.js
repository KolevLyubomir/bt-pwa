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
    const saveBtn = document.getElementById(`${prefix}-save`);
    const deleteBtn = document.getElementById(`${prefix}-delete`);
    const gridContainer = document.getElementById(`${prefix}-grid-container`);
    const capBrand = document.getElementById(`${prefix}-cap-brand`);
    const settingsBtn = document.getElementById(`${prefix}-settings-btn`);
    const brandSelect = document.getElementById(`${prefix}-brand-select`);
    const customNameField = document.getElementById(`${prefix}-custom-name-field`);
    const productImg = document.getElementById(`${prefix}-img`);
    
    if ( !configDiv || !slider || !saveBtn || !gridContainer || !settingsBtn || !brandSelect) {
      console.error(`Липсващи елементи за ${prefix}`);
      return;
    }
    
    const STORAGE_KEY = `bt_add_${prefix}_v310`; // Ключ за localStorage

    let currentGridInstance = null; // Тук пазим инстанцията на "умната" мрежа

    // --- Настройки по подразбиране ---
    let settings = {
      // enabled е премахнато. `rows > 0` е новата "истина".
      brand: Object.keys(brandsMap)[0], // Първата марка от списъка
      customName: '',
      rows: 0
    };
    
    // --- 1. Зареждане от Паметта ---
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved) {
        settings = { ...settings, ...saved }; // Смесваме запазените с тези по подразбиране
      }
    } catch (e) {}

    // --- 2. Прилагане на Настройките при Старт (UI функция) ---
    function updateUI() {
      const isConfigured = settings.rows > 0;
      const brandKey = settings.brand || Object.keys(brandsMap)[0];
      const brandData = brandsMap[brandKey] || brandsMap["custom"];
      let currentName = brandData.name; // Име от картата (напр. "Thorne Research")

      // A. Попълваме панела с настройки (който е скрит)
      brandSelect.value = brandKey;
      slider.value = settings.rows;
      sliderVal.textContent = settings.rows;

      if (brandKey === 'custom') {
        customNameField.style.display = 'block';
        nameInput.value = settings.customName || '';
        if(settings.customName) {
           currentName = settings.customName;
        } else {
           currentName = nameInput.placeholder; // Ако няма, взимаме плейсхолдъра
        }
      } else {
        customNameField.style.display = 'none';
      }
      
      // Б. Конфигурираме видимата част (Хедъра)
      if (isConfigured) {
        productImg.src = brandData.img;
        productImg.style.display = 'block';
        capBrand.textContent = currentName;
        settingsBtn.classList.remove('active'); // Зелено
        settingsBtn.classList.add('inactive'); // Сиво
        gridContainer.style.display = 'block';
        
        // ВАЖНО: Генерираме таблицата
        generateGrid(settings.rows, currentName);

      } else {
        // Продуктът е "Изключен"
        productImg.style.display = 'none';
        capBrand.textContent = '...'; // Празно
        settingsBtn.classList.remove('inactive'); // Сиво
        settingsBtn.classList.add('active'); // Зелено
        gridContainer.style.display = 'none';
        gridContainer.innerHTML = ""; // Трием таблицата
        
        // Унищожаваме старата мрежа, ако е имало
        if (currentGridInstance) {
          window.grids = window.grids.filter(g => g !== currentGridInstance);
          currentGridInstance.destroy();
          currentGridInstance = null;
        }
      }
    }

    // --- 3. Дефиниране на Event Listeners ---

    // Бутон Настройки (Зъбно колело) - Отваря/Затваря панела
    settingsBtn.addEventListener('click', () => {
      configDiv.style.display = (configDiv.style.display === 'block') ? 'none' : 'block';
    });

    // Падащо меню за Марки - сменя снимка и име (само в UI)
    brandSelect.addEventListener('change', () => {
      const selectedBrand = brandSelect.value;
      const brandData = brandsMap[selectedBrand] || brandsMap["custom"];
      
      if (selectedBrand === 'custom') {
        customNameField.style.display = 'block';
        // Не сменяме снимката веднага, чакаме "Запази"
      } else {
        customNameField.style.display = 'none';
        // Сменяме снимката веднага за преглед
        productImg.src = brandData.img;
        productImg.style.display = 'block';
      }
    });

    // Плъзгач
    slider.addEventListener('input', () => {
      sliderVal.textContent = slider.value;
    });

    // Бутон "Запази"
    saveBtn.addEventListener('click', () => {
      settings.rows = parseInt(slider.value, 10);
      settings.brand = brandSelect.value;
      settings.customName = (settings.brand === 'custom') ? nameInput.value.trim() : '';
      
      saveAndRerender();
      configDiv.style.display = 'none'; // Скриваме панела след запазване
    });
    
    // Бутон "Изтрий"
    deleteBtn.addEventListener('click', () => {
      // (Вече не питаме, просто нулираме и запазваме)
      settings.rows = 0;
      settings.customName = '';
      
      saveAndRerender();
      configDiv.style.display = 'none'; // Скриваме панела
    });

    // --- 4. Основни Функции ---

    function saveAndRerender() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      updateUI(); // Прилагаме всичко наново
    }

    /**
     * Генерира HTML-а за таблицата и я инициализира
     */
    function generateGrid(rowCount, productName) {
      // 1. Унищожаваме старата мрежа, ако съществува
      if (currentGridInstance) {
        window.grids = window.grids.filter(g => g !== currentGridInstance);
        currentGridInstance.destroy();
        currentGridInstance = null;
      }
      
      if (rowCount === 0) {
        gridContainer.innerHTML = "";
        return;
      }

      // 3. Генерираме default times
      let defaultTimes = [];
      const timesMap = DEFAULT_TIMES_MAP[rowCount] || DEFAULT_TIMES_MAP[1]; // Резерва
      for(let i = 0; i < rowCount; i++) {
        const time = (timesMap[i] && timesMap[i][0]) || "12:00";
        defaultTimes.push(Array(7).fill(time));
      }

      const tableId = `${prefix}-table`;
      const buttonId = `btnProgIntake${prefix.toUpperCase()}`;
      
      // 4. Генерираме HTML
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

      // 5. Инициализираме "умната" мрежа
      setTimeout(() => {
        currentGridInstance = createProductGrid({
          tableId: tableId,
          buttonId: buttonId,
          storageKey: `bt_grid_${prefix}_v310`,
          defaultTimes: defaultTimes,
          productName: productName,
          blockId: `${prefix}-block`
        });
        
        // 6. Добавяме новата инстанция към глобалния списък
        if (window.grids && currentGridInstance) {
          window.grids.push(currentGridInstance);
        }
      }, 0);
    }
    
    // --- 5. Първоначално стартиране ---
    updateUI();
  }

  // ===================================
  // --- ИНИЦИАЛИЗАЦИЯ ---
  // ===================================

  // Инициализираме само Берберин засега
  createConfigurableProduct('ber', BERBERINE_BRANDS); 
  
  // TODO: Инициализирай и 'glu' и 'egc', когато имаме техните данни
  // createConfigurableProduct('glu', GLUCOMANNAN_BRANDS);
  // createConfigurableProduct('egc', EGC_BRANDS);

})();