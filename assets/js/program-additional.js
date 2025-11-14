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
    const enableCheck = document.getElementById(`${prefix}-enable`);
    const configDiv = document.getElementById(`${prefix}-config`);
    const nameInput = document.getElementById(`${prefix}-name`);
    const slider = document.getElementById(`${prefix}-slider`);
    const sliderVal = document.getElementById(`${prefix}-slider-val`);
    const saveBtn = document.getElementById(`${prefix}-save`);
    const deleteBtn = document.getElementById(`${prefix}-delete`);
    const gridContainer = document.getElementById(`${prefix}-grid-container`);
    const block = document.getElementById(`${prefix}-block`);
    const cap = document.getElementById(`${prefix}-cap`);
    const settingsBtn = document.getElementById(`${prefix}-settings-btn`);
    const brandSelect = document.getElementById(`${prefix}-brand-select`);
    const customNameField = document.getElementById(`${prefix}-custom-name-field`);
    const productImg = document.getElementById(`${prefix}-img`);
    
    if (!enableCheck || !configDiv || !slider || !saveBtn || !gridContainer) {
      console.error(`Липсващи елементи за ${prefix}`);
      return;
    }
    
    const STORAGE_KEY = `bt_add_${prefix}_v310`; // Ключ за localStorage

    let currentGridInstance = null; // Тук пазим инстанцията на "умната" мрежа

    // --- Настройки по подразбиране ---
    let settings = {
      enabled: false,
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

    // --- 2. Прилагане на Настройките при Старт ---
    
    // Функция за обновяване на UI (ще се ползва няколко пъти)
    function updateUI() {
      // 1. Тогъл суич
      enableCheck.checked = settings.enabled;

      // 2. Падащо меню
      brandSelect.value = settings.brand;

      // 3. Поле за име
      const brandData = brandsMap[settings.brand] || brandsMap["custom"];
      let currentName = brandData.name; // Име от картата (напр. "Thorne Research")

      if (settings.brand === 'custom') {
        customNameField.style.display = 'block'; // Показваме полето
        nameInput.value = settings.customName || ''; // Слагаме запазеното име
        if(settings.customName) {
           currentName = settings.customName; // Ако има запазено, то е приоритет
        } else {
           currentName = nameInput.placeholder; // Ако няма, взимаме плейсхолдъра
        }
      } else {
        customNameField.style.display = 'none'; // Скриваме полето
      }
      
      // 4. Снимка и Заглавие
      productImg.src = brandData.img;
      cap.textContent = currentName;
      
      // 5. Плъзгач
      slider.value = settings.rows;
      sliderVal.textContent = settings.rows;

      // 6. Показване/Скриване на елементи
      if (settings.enabled) {
        settingsBtn.style.display = 'inline-flex';
        productImg.style.display = 'block';
        // Генерираме таблицата (ако има редове)
        generateGrid(settings.rows, currentName);
      } else {
        settingsBtn.style.display = 'none';
        productImg.style.display = 'none';
        configDiv.style.display = 'none'; // Скриваме настройките, ако е изключен
        gridContainer.innerHTML = ""; // Трием таблицата
      }
    }

    // --- 3. Дефиниране на Event Listeners ---

    // Тогъл Суич (Вкл/Изкл)
    enableCheck.addEventListener('change', () => {
      settings.enabled = enableCheck.checked;
      if (settings.enabled && settings.rows === 0) {
        // Ако го включваш за пръв път, сложи 1 прием по подразбиране
        settings.rows = 1;
      }
      if (!settings.enabled) {
        // Ако го изключваш, нулирай редовете
        settings.rows = 0;
      }
      saveAndRerender();
    });

    // Бутон Настройки (Зъбно колело)
    settingsBtn.addEventListener('click', () => {
      // Просто показва/скрива панела
      configDiv.style.display = (configDiv.style.display === 'block') ? 'none' : 'block';
    });

    // Падащо меню за Марки
    brandSelect.addEventListener('change', () => {
      const selectedBrand = brandSelect.value;
      settings.brand = selectedBrand;
      
      const brandData = brandsMap[selectedBrand] || brandsMap["custom"];
      productImg.src = brandData.img; // Сменяме снимката веднага

      if (selectedBrand === 'custom') {
        customNameField.style.display = 'block';
        cap.textContent = nameInput.value || nameInput.placeholder;
      } else {
        customNameField.style.display = 'none';
        cap.textContent = brandData.name;
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
      
      // Ако са 0 редове, но е включен, изключи го
      if (settings.rows === 0 && settings.enabled) {
        settings.enabled = false;
      }
      
      saveAndRerender();
      configDiv.style.display = 'none'; // Скриваме панела след запазване
    });
    
    // Бутон "Изтрий"
    deleteBtn.addEventListener('click', () => {
      if (!confirm(`Сигурен ли си, че искаш да изтриеш графика за ${cap.textContent}?`)) {
        return;
      }
      settings.enabled = false;
      settings.rows = 0;
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
        // Премахваме я от глобалния масив, за да спре да се ъпдейтва
        window.grids = window.grids.filter(g => g !== currentGridInstance);
        currentGridInstance.destroy();
        currentGridInstance = null;
      }
      
      // 2. Ако няма редове, чистим и излизаме
      if (rowCount === 0) {
        gridContainer.innerHTML = "";
        return;
      }

      // 3. Генерираме default times (7 дни в седмицата)
      let defaultTimes = [];
      const timesMap = DEFAULT_TIMES_MAP[rowCount] || DEFAULT_TIMES_MAP[1]; // Резерва
      for(let i = 0; i < rowCount; i++) {
        const time = (timesMap[i] && timesMap[i][0]) || "12:00"; // Резервен час
        defaultTimes.push(Array(7).fill(time));
      }

      const tableId = `${prefix}-table`;
      const buttonId = `btnProgIntake${prefix.toUpperCase()}`;
      
      // 4. Генерираме HTML за таблицата
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

      // 5. Инициализираме "умната" мрежа за тази НОВА таблица
      setTimeout(() => {
        currentGridInstance = createProductGrid({
          tableId: tableId,
          buttonId: buttonId,
          storageKey: `bt_grid_${prefix}_v310`, // Отделен storage за *данните* от мрежата
          defaultTimes: defaultTimes,
          productName: productName,
          blockId: `${prefix}-block`
        });
        
        // 6. Добавяме новата инстанция към глобалния списък за ъпдейти
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