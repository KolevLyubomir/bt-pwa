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
      img: "https://izgorimazninite.com/wp-content/uploads/2020/02/berberine-2.jpg"
    }
  };

  // Часове по подразбиране за редовете (0–6; 0 не се ползва, слайдерът е 1–6)
  const DEFAULT_TIMES_MAP = [
    [], // 0
    [["12:00"]],                                      // 1
    [["08:00"], ["12:00"]],                           // 2
    [["08:00"], ["12:00"], ["19:00"]],                // 3
    [["08:00"], ["12:00"], ["16:00"], ["19:00"]],     // 4
    [["08:00"], ["10:00"], ["12:00"], ["16:00"], ["19:00"]], // 5
    [["08:00"], ["10:00"], ["12:00"], ["16:00"], ["19:00"], ["22:00"]] // 6
  ];

  /**
   * Създава логиката за един "Допълнителен" продукт
   * @param {string} prefix - Уникален префикс (npr. 'ber' за Берберин)
   * @param {object} brandsMap - Обект с данните за марките
   */
  function createConfigurableProduct(prefix, brandsMap) {
    // --- Взимане на Елементи ---
    const configDiv       = document.getElementById(`${prefix}-config`);
    const nameInput       = document.getElementById(`${prefix}-name`);
    const slider          = document.getElementById(`${prefix}-slider`);
    const sliderVal       = document.getElementById(`${prefix}-slider-val`);
    const sliderTrackFill = document.getElementById(`${prefix}-slider-track-fill`);
    const saveBtn         = document.getElementById(`${prefix}-save`);
    const deleteBtn       = document.getElementById(`${prefix}-delete`);
    const gridContainer   = document.getElementById(`${prefix}-grid-container`);
    const capMain         = document.getElementById(`${prefix}-cap-main`);   // Основно заглавие (Берберин)
    const capBrand        = document.getElementById(`${prefix}-cap-brand`);  // Подзаглавие (Марка)
    const head            = document.getElementById(`${prefix}-head`);
    const brandSelect     = document.getElementById(`${prefix}-brand-select`);
    const customNameField = document.getElementById(`${prefix}-custom-name-field`);
    const productImg      = document.getElementById(`${prefix}-img`);
    const intakeBtn       = document.getElementById(`btnProgIntake${prefix.toUpperCase()}`);

    if (!configDiv || !slider || !saveBtn || !gridContainer || !head || !brandSelect) {
      console.error(`Липсващи елементи за ${prefix}`);
      return;
    }

    const STORAGE_KEY = `bt_add_${prefix}_v310`; // Ключ за localStorage на конфигуратора

    let currentGridInstance = null;

    // Настройки по подразбиране за конфигуратора
    let settings = {
      brand: Object.keys(brandsMap)[0], // ключ за марката
      customName: "",
      rows: 0 // 0 = неактивен
    };

    // -------- Универсален long-press helper --------
    function attachLongPress(el, handler, delayMs) {
      if (!el || typeof handler !== "function") return;
      const delay = typeof delayMs === "number" ? delayMs : 500;
      let timer = null;

      function clear() {
        if (timer !== null) {
          clearTimeout(timer);
          timer = null;
        }
      }

      function start(e) {
        // игнорираме десен бутон на мишката
        if (e && e.button === 2) return;
        clear();
        timer = setTimeout(function() {
          timer = null;
          handler(e);
        }, delay);
      }

      el.addEventListener("mousedown", start);
      el.addEventListener("touchstart", start, { passive: true });

      ["mouseup", "mouseleave", "touchend", "touchcancel"].forEach(function(evt) {
        el.addEventListener(evt, clear);
      });
    }
    // -----------------------------------------------

    // Красиво потвърждение за изтриване на марката
    function showDeleteConfirm(message, onConfirm) {
      const backdrop = document.createElement("div");
      backdrop.className = "bt-confirm-backdrop";

      const dialog = document.createElement("div");
      dialog.className = "bt-confirm-dialog";

      const text = document.createElement("p");
      text.className = "bt-confirm-text";
      text.textContent = message;

      const actions = document.createElement("div");
      actions.className = "bt-confirm-actions";

      const btnCancel = document.createElement("button");
      btnCancel.type = "button";
      btnCancel.className = "bt-confirm-btn bt-confirm-btn-secondary";
      btnCancel.textContent = "Откажи";

      const btnOk = document.createElement("button");
      btnOk.type = "button";
      btnOk.className = "bt-confirm-btn bt-confirm-btn-danger";
      btnOk.textContent = "Изтрий";

      actions.appendChild(btnCancel);
      actions.appendChild(btnOk);
      dialog.appendChild(text);
      dialog.appendChild(actions);
      backdrop.appendChild(dialog);
      document.body.appendChild(backdrop);

      function close() {
        if (backdrop && backdrop.parentNode) {
          backdrop.parentNode.removeChild(backdrop);
        }
      }

      btnCancel.addEventListener("click", close);
      btnOk.addEventListener("click", function() {
        close();
        if (typeof onConfirm === "function") {
          onConfirm();
        }
      });
      backdrop.addEventListener("click", function(e) {
        if (e.target === backdrop) close();
      });
    }

    // --- Зареждане от localStorage (само конфигуратора, не часовете) ---
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved) {
        settings = Object.assign({}, settings, saved);
      }
    } catch (e) {}

    // Плъзгач – оцветяване на запълнената част
    function updateSliderFill() {
      if (!sliderTrackFill) return;
      const min = Number(slider.min || 1);
      const max = Number(slider.max || 6);
      const val = Number(slider.value || 3);
      const percentage = ((val - min) / (max - min)) * 100;
      sliderTrackFill.style.width = percentage + "%";
    }

    // Обновяване на UI според settings
    function updateUI(showConfig) {
      if (showConfig === void 0) showConfig = false;

      const isConfigured = settings.rows > 0;
      const brandKey = settings.brand || Object.keys(brandsMap)[0];
      const brandData = brandsMap[brandKey] || brandsMap["custom"];
      let currentName = brandData.name;

      // Попълваме панела с настройки
      brandSelect.value = brandKey;

      if (isConfigured) {
        slider.value = String(settings.rows);
      } else {
        slider.value = "3"; // по подразбиране 3 приема
      }
      sliderVal.textContent = slider.value;
      updateSliderFill();

      if (brandKey === "custom") {
        customNameField.style.display = "block";
        nameInput.value = settings.customName || "";
        if (settings.customName) {
          currentName = settings.customName;
        } else {
          currentName = nameInput.placeholder || currentName;
        }
      } else {
        customNameField.style.display = "none";
        nameInput.value = "";
      }

      // Видимата част (хедъра и картинката)
      if (isConfigured) {
        if (productImg && brandData.img) {
          productImg.src = brandData.img;
          productImg.alt = currentName;
          productImg.style.display = "block";
        }
        if (capMain) {
          capMain.classList.add("configured");
        }
        if (capBrand) {
          capBrand.textContent = currentName;
        }
        gridContainer.style.display = "block";
      } else {
        // продуктът е „изключен“
        if (productImg) {
          productImg.style.display = "none";
        }
        if (capMain) {
          capMain.classList.remove("configured");
        }
        if (capBrand) {
          capBrand.textContent = "";
        }
        gridContainer.style.display = "none";
        gridContainer.innerHTML = "";

        // скриваме бутона „Прием“, ако няма марка
        if (intakeBtn) {
          intakeBtn.style.display = "none";
          intakeBtn.removeAttribute("data-row");
          intakeBtn.removeAttribute("data-dow");
        }

        if (currentGridInstance) {
          if (Array.isArray(window.grids)) {
            window.grids = window.grids.filter(function(g) {
              return g !== currentGridInstance;
            });
          }
          if (typeof currentGridInstance.destroy === "function") {
            currentGridInstance.destroy();
          }
          currentGridInstance = null;
        }
      }

      configDiv.style.display = showConfig ? "block" : "none";
    }

    // Запис + евентуално генериране наново на таблицата
    function saveAndRerender(showConfig, needsGridUpdate) {
      // Пазим само конфигурацията – часовете си живеят отделно в bt_grid_ber_v310
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

      const brandData = brandsMap[settings.brand] || brandsMap["custom"];
      let currentName = brandData.name;

      if (settings.brand === "custom") {
        if (settings.customName) {
          currentName = settings.customName;
        } else {
          currentName = nameInput.placeholder || currentName;
        }
      }

      if (needsGridUpdate) {
        generateGrid(settings.rows, currentName);
      }

      updateUI(showConfig);

      if (typeof window.masterUpdateAllGrids === "function") {
        window.masterUpdateAllGrids();
      }
    }

    // Генериране на таблицата за Берберин (по брой редове)
    function generateGrid(rowCount, productName) {
      // чистим старата инстанция (но НЕ трием localStorage с часовете)
      if (currentGridInstance) {
        if (Array.isArray(window.grids)) {
          window.grids = window.grids.filter(function(g) {
            return g !== currentGridInstance;
          });
        }
        if (typeof currentGridInstance.destroy === "function") {
          currentGridInstance.destroy();
        }
        currentGridInstance = null;
      }

      if (rowCount === 0) {
        gridContainer.innerHTML = "";
        gridContainer.style.display = "none";
        if (intakeBtn) {
          intakeBtn.style.display = "none";
          intakeBtn.removeAttribute("data-row");
          intakeBtn.removeAttribute("data-dow");
        }
        return;
      }

      const defaultTimes = [];
      const timesMap = DEFAULT_TIMES_MAP[rowCount] || DEFAULT_TIMES_MAP[1];

      for (let i = 0; i < rowCount; i++) {
        const time = (timesMap[i] && timesMap[i][0]) || "12:00";
        // 7 дни – попълваме с този час; createProductGrid после ще ги override-не от localStorage
        defaultTimes.push([
          time, time, time, time, time, time, time
        ]);
      }

      const tableId  = `${prefix}-table`;
      const buttonId = `btnProgIntake${prefix.toUpperCase()}`;

      let tbodyHtml = "";
      for (let r = 0; r < rowCount; r++) {
        tbodyHtml += "<tr>";
        for (let d = 1; d <= 7; d++) {
          const dow = (d === 7) ? 0 : d;
          const timeIndex = (dow === 0) ? 6 : (dow - 1);
          const cellTime = defaultTimes[r][timeIndex];
          tbodyHtml += `<td class="pl-time-cell" data-row="${r}" data-dow="${dow}">${cellTime}</td>`;
        }
        tbodyHtml += "</tr>";
      }

      gridContainer.innerHTML =
        `<table class="pl-table" id="${tableId}">
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
        </table>`;

      gridContainer.style.display = "block";

      setTimeout(function() {
        if (typeof createProductGrid !== "function") {
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

        if (!window.grids) {
          window.grids = [];
        }
        if (currentGridInstance) {
          window.grids.push(currentGridInstance);
          if (typeof currentGridInstance.updateIntakeStates === "function") {
            currentGridInstance.updateIntakeStates();
          }
        }
      }, 0);
    }

    // -------- Event listeners --------

    head.classList.add("clickable");

    // Кратко натискане:
    // - ако НЯМА конфигурация (rows === 0) → отваря/затваря панела за добавяне;
    // - ако ИМА конфигурация → не прави нищо (редакцията е само със задържане).
    head.addEventListener("click", function() {
      if (settings.rows > 0) {
        return;
      }
      const isHidden =
        configDiv.style.display === "none" ||
        configDiv.style.display === "";
      configDiv.style.display = isHidden ? "block" : "none";
    });

    // Задържане (long press) – за Редакция/Добавяне
    attachLongPress(head, function() {
      if (settings.rows === 0) {
        // все още празно → просто отваряме
        configDiv.style.display = "block";
        return;
      }
      const isHidden =
        configDiv.style.display === "none" ||
        configDiv.style.display === "";
      configDiv.style.display = isHidden ? "block" : "none";
    }, 550);

    // Падащо меню за марките
    brandSelect.addEventListener("change", function() {
      const selectedBrand = brandSelect.value;
      if (selectedBrand === "custom") {
        customNameField.style.display = "block";
      } else {
        customNameField.style.display = "none";
      }
    });

    // Плъзгач – промяна на стойността
    slider.addEventListener("input", function() {
      sliderVal.textContent = slider.value;
      updateSliderFill();
    });

    // Бутон „Запис“
    saveBtn.addEventListener("click", function() {
      const newRows = parseInt(slider.value, 10);
      const newBrand = brandSelect.value;
      const newCustomName =
        newBrand === "custom" ? (nameInput.value || "").trim() : "";

      const needsGridUpdate =
        newRows !== settings.rows ||
        newBrand !== settings.brand ||
        newCustomName !== settings.customName;

      settings.rows = newRows;
      settings.brand = newBrand;
      settings.customName = newCustomName;

      saveAndRerender(false, needsGridUpdate);
    });

    // Бутон „Изтрий марка“
    deleteBtn.addEventListener("click", function() {
      if (settings.rows === 0) {
        configDiv.style.display = "none";
        return;
      }

      showDeleteConfirm(
        "Наистина ли искаш да изтриеш избраната марка? Подбраните часове ще се запазят за следваща марка.",
        function() {
          settings.rows = 0;
          settings.customName = "";

          if (intakeBtn) {
            intakeBtn.style.display = "none";
            intakeBtn.removeAttribute("data-row");
            intakeBtn.removeAttribute("data-dow");
          }

          saveAndRerender(false, true);
        }
      );
    });

    // Стартово прилагане
    updateUI(false);
  }

  // Инициализираме Берберин
  createConfigurableProduct("ber", BERBERINE_BRANDS);

})();
