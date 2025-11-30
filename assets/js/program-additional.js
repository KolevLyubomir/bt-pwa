/* global createProductGrid, ModalLogic */

(function () {
  "use strict";

  // ============================================
  // БРАНДОВЕ – ЛОКАЛНИ КАРТИ С КАРТИНКИ
  // ============================================

  // Берберин
  const BERBERINE_BRANDS = {
    "thorne": {
      name: "Thorne Research",
      img: "assets/products/additional/ber-thorne.webp",
      icon: "assets/products/additional/icons/ber-thorne-icon.webp"
    },
    "toniiq": {
      name: "Toniiq - Ultra High Strength",
      img: "assets/products/additional/ber-toniiq.webp",
      icon: "assets/products/additional/icons/ber-toniiq-icon.webp"
    },
    "it": {
      name: "Integrative Therapeutics",
      img: "assets/products/additional/ber-it.webp",
      icon: "assets/products/additional/icons/ber-it-icon.webp"
    },
    "nutricost": {
      name: "Nutricost",
      img: "assets/products/additional/ber-nutricost.webp",
      icon: "assets/products/additional/icons/ber-nutricost-icon.webp"
    },
    "now": {
      name: "NOW Foods - Berberine Glucose",
      img: "assets/products/additional/ber-now.webp",
      icon: "assets/products/additional/icons/ber-now-icon.webp"
    },
    "custom": {
      name: "Друго (въведи):",
      img: "assets/products/additional/ber-custom.webp",
      icon: "assets/products/additional/icons/ber-custom-icon.webp"
    }
  };

  // Глюкоманан
  const GLUCOMANNAN_BRANDS = {
    "now": {
      name: "NOW Foods - Glucomannan",
      img: "assets/products/additional/glu-now.webp",
      icon: "assets/products/additional/icons/glu-now-icon.webp"
    },
    "swanson": {
      name: "Swanson Glucomannan",
      img: "assets/products/additional/glu-swanson.webp",
      icon: "assets/products/additional/icons/glu-swanson-icon.webp"
    },
    "jarrow": {
      name: "Jarrow Formulas Glucomannan",
      img: "assets/products/additional/glu-jarrow.webp",
      icon: "assets/products/additional/icons/glu-jarrow-icon.webp"
    },
    "lifeext": {
      name: "Life Extension Glucomannan",
      img: "assets/products/additional/glu-lifeext.webp",
      icon: "assets/products/additional/icons/glu-lifeext-icon.webp"
    },
    "custom": {
      name: "Друго (въведи):",
      img: "assets/products/additional/glu-custom.webp",
      icon: "assets/products/additional/icons/glu-custom-icon.webp"
    }
  };

  // EGCg – Зелен чай
  const EGCG_BRANDS = {
    "now": {
      name: "NOW Foods - EGCg Green Tea",
      img: "assets/products/additional/egc-now.webp",
      icon: "assets/products/additional/icons/egc-now-icon.webp"
    },
    "lifeext": {
      name: "Life Extension Mega Green Tea Extract",
      img: "assets/products/additional/egc-lifeext.webp",
      icon: "assets/products/additional/icons/egc-lifeext-icon.webp"
    },
    "jarrow": {
      name: "Jarrow Green Tea 500mg",
      img: "assets/products/additional/egc-jarrow.webp",
      icon: "assets/products/additional/icons/egc-jarrow-icon.webp"
    },
    "swanson": {
      name: "Swanson Green Tea Extract",
      img: "assets/products/additional/egc-swanson.webp",
      icon: "assets/products/additional/icons/egc-swanson-icon.webp"
    },
    "custom": {
      name: "Друго (въведи):",
      img: "assets/products/additional/egc-custom.webp",
      icon: "assets/products/additional/icons/egc-custom-icon.webp"
    }
  };

  // ============================================
  // НОВА СХЕМА НА ЧАСОВЕТЕ ПО ПОДРАЗБИРАНЕ
  // ============================================

  const DEFAULT_TIMES_MAP = [
    [],
    [["12:00"]],
    [["08:00"], ["12:00"]],
    [["08:00"], ["12:00"], ["18:00"]],
    [["08:00"], ["12:00"], ["15:00"], ["18:00"]],
    [["08:00"], ["10:00"], ["12:00"], ["15:00"], ["18:00"]],
    [["08:00"], ["10:00"], ["12:00"], ["15:00"], ["18:00"], ["21:00"]]
  ];

  function timeStrToMin(str) {
    if (!str || typeof str !== "string") return 0;
    var parts = str.split(":");
    var h = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10);
    if (!isFinite(h)) h = 0;
    if (!isFinite(m)) m = 0;
    if (h < 0) h = 0;
    if (h > 23) h = 23;
    if (m < 0) m = 0;
    if (m > 59) m = 59;
    return h * 60 + m;
  }

  function minToTimeStr(min) {
    if (!isFinite(min) || min < 0) min = 0;
    var h = Math.floor(min / 60);
    var m = min % 60;
    if (h > 23) h = 23;
    if (m > 59) m = 59;
    var hs = (h < 10 ? "0" : "") + h;
    var ms = (m < 10 ? "0" : "") + m;
    return hs + ":" + ms;
  }

  // Дълго натискане (за редакция)
  function attachLongPress(el, handler, delayMs) {
    if (!el || typeof handler !== "function") return;
    var delay = typeof delayMs === "number" ? delayMs : 550;
    var timer = null;

    function clear() {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
    }

    function start(e) {
      if (e && e.button === 2) return;
      clear();
      timer = setTimeout(function () {
        timer = null;
        handler(e);
      }, delay);
    }

    el.addEventListener("mousedown", start);
    el.addEventListener("touchstart", start, { passive: true });

    ["mouseup", "mouseleave", "touchend", "touchcancel"].forEach(function (evt) {
      el.addEventListener(evt, clear);
    });
  }

  // ============================================
  // ГЛАВНА ФУНКЦИЯ ЗА КОНФИГУРИРУЕМ ПРОДУКТ
  // ============================================

  function createConfigurableProduct(prefix, brandsMap) {
    var configDiv = document.getElementById(prefix + "-config");
    var nameInput = document.getElementById(prefix + "-name");
    var slider = document.getElementById(prefix + "-slider");
    var sliderVal = document.getElementById(prefix + "-slider-val");
    var sliderTrackFill = document.getElementById(prefix + "-slider-track-fill");
    var saveBtn = document.getElementById(prefix + "-save");
    var deleteBtn = document.getElementById(prefix + "-delete");
    var gridContainer = document.getElementById(prefix + "-grid-container");
    var capMain = document.getElementById(prefix + "-cap-main");
    var capBrand = document.getElementById(prefix + "-cap-brand");
    var head = document.getElementById(prefix + "-head");
    var brandSelect = document.getElementById(prefix + "-brand-select");
    var customNameField = document.getElementById(prefix + "-custom-name-field");
    var productImg = document.getElementById(prefix + "-img");
    var intakeBtn = document.getElementById("btnProgIntake" + prefix.toUpperCase());

    if (!configDiv || !slider || !saveBtn || !gridContainer || !head || !brandSelect) {
      console.error("Липсващи елементи за " + prefix);
      return;
    }

    var STORAGE_KEY = "bt_add_" + prefix + "_v310";
    var GRID_STORAGE_KEY = "bt_grid_" + prefix + "_v310";

    var currentGridInstance = null;

    var settings = {
      brand: Object.keys(brandsMap)[0],
      customName: "",
      rows: 0
    };

    // Четене на конфигурация от localStorage
    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved) {
        if (saved.brand) settings.brand = saved.brand;
        if (typeof saved.customName === "string") settings.customName = saved.customName;
        if (typeof saved.rows === "number") settings.rows = saved.rows;
      }
    } catch (e) { }

    function updateSliderFill() {
      if (!sliderTrackFill) return;
      var min = parseInt(slider.min || "1", 10);
      var max = parseInt(slider.max || "6", 10);
      var val = parseInt(slider.value || "3", 10);
      var percentage = ((val - min) / (max - min)) * 100;
      if (percentage < 0) percentage = 0;
      if (percentage > 100) percentage = 100;
      sliderTrackFill.style.width = percentage + "%";
    }

    // ------------------------------------------
    // Тъмен confirm диалог за изтриване на Марката
    // ------------------------------------------
    function showDeleteConfirm(message, onConfirm) {
      var backdrop = document.createElement("div");
      backdrop.className = "bt-confirm-backdrop";

      var dialog = document.createElement("div");
      dialog.className = "bt-confirm-dialog";

      var text = document.createElement("p");
      text.className = "bt-confirm-text";
      text.textContent = message;

      var actions = document.createElement("div");
      actions.className = "bt-confirm-actions";

      var btnCancel = document.createElement("button");
      btnCancel.type = "button";
      btnCancel.className = "bt-confirm-btn bt-confirm-btn-secondary";
      btnCancel.textContent = "Откажи";

      var btnOk = document.createElement("button");
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

      btnCancel.addEventListener("click", function () {
        close();
      });

      btnOk.addEventListener("click", function () {
        close();
        if (typeof onConfirm === "function") onConfirm();
      });

      backdrop.addEventListener("click", function (e) {
        if (e.target === backdrop) close();
      });
    }

    // ------------------------------------------
    // Модал за избор на марка
    // ------------------------------------------
    var brandModal = null;
    var brandModalList = null;
    var brandModalTitle = null;
    var brandPickerBtn = null;
    var brandPickerIcon = null;
    var brandPickerLabel = null;

    function openBrandModal() {
      if (!brandModal) buildBrandModal();
      var current = brandSelect.value || settings.brand;
      var children = brandModalList ? brandModalList.children : [];
      for (var i = 0; i < children.length; i++) {
        var btn = children[i];
        var bKey = btn.getAttribute("data-brand-key");
        if (bKey === current) {
          btn.style.borderColor = "#16a34a";
          btn.style.background = "rgba(22,163,74,0.25)";
        } else {
          btn.style.borderColor = "#334155";
          btn.style.background = "#020617";
        }
      }
      brandModal.style.display = "flex";
    }

    function closeBrandModal() {
      if (brandModal) {
        brandModal.style.display = "none";
      }
    }

    function buildBrandModal() {
      brandModal = document.createElement("div");
      brandModal.id = prefix + "-brand-modal";
      brandModal.style.position = "fixed";
      brandModal.style.inset = "0";
      brandModal.style.background = "rgba(0,0,0,0.45)";
      brandModal.style.display = "none";
      brandModal.style.alignItems = "center";
      brandModal.style.justifyContent = "center";
      brandModal.style.zIndex = "9999";

      var dialog = document.createElement("div");
      dialog.style.background = "#020617"; // тъмен фон
      dialog.style.borderRadius = "20px";
      dialog.style.padding = "18px 20px";
      dialog.style.width = "92%";
      dialog.style.maxWidth = "360px";
      dialog.style.maxHeight = "80vh";
      dialog.style.display = "flex";
      dialog.style.flexDirection = "column";
      dialog.style.boxShadow = "0 18px 45px rgba(0,0,0,0.65)";
      dialog.style.border = "1px solid #1f2937";
      dialog.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

      var headerRow = document.createElement("div");
      headerRow.style.display = "flex";
      headerRow.style.justifyContent = "space-between";
      headerRow.style.alignItems = "center";
      headerRow.style.marginBottom = "12px";

      brandModalTitle = document.createElement("div");
      // 🔸 Динамично заглавие според основния надпис
      var headerName = (capMain && capMain.textContent) ? capMain.textContent : "марка";
      brandModalTitle.textContent = "Избор на " + headerName;
      brandModalTitle.style.fontSize = "15px";
      brandModalTitle.style.fontWeight = "600";
      brandModalTitle.style.color = "#f9fafb";

      var closeX = document.createElement("button");
      closeX.type = "button";
      closeX.textContent = "×";
      closeX.style.border = "none";
      closeX.style.background = "transparent";
      closeX.style.fontSize = "20px";
      closeX.style.lineHeight = "1";
      closeX.style.cursor = "pointer";
      closeX.style.color = "#9ca3af";
      closeX.addEventListener("click", closeBrandModal);

      headerRow.appendChild(brandModalTitle);
      headerRow.appendChild(closeX);

      brandModalList = document.createElement("div");
      brandModalList.style.display = "flex";
      brandModalList.style.flexDirection = "column";
      brandModalList.style.gap = "8px";
      brandModalList.style.overflowY = "auto";
      brandModalList.style.paddingRight = "4px";
      brandModalList.style.marginTop = "4px";

      Object.keys(brandsMap).forEach(function (key) {
        var bData = brandsMap[key];
        var itemBtn = document.createElement("button");
        itemBtn.type = "button";
        itemBtn.setAttribute("data-brand-key", key);
        itemBtn.style.display = "flex";
        itemBtn.style.alignItems = "center";
        itemBtn.style.width = "100%";
        itemBtn.style.borderRadius = "999px";
        itemBtn.style.border = "1px solid #334155";
        itemBtn.style.padding = "8px 10px";
        itemBtn.style.background = "#020617";
        itemBtn.style.cursor = "pointer";
        itemBtn.style.fontSize = "13px";
        itemBtn.style.justifyContent = "flex-start";
        itemBtn.style.color = "#e5e7eb";

        var left = document.createElement("div");
        left.style.display = "flex";
        left.style.alignItems = "center";
        left.style.gap = "8px";

        var icon = document.createElement("img");
        icon.src = bData.icon || bData.img;
        icon.alt = bData.name;
        icon.style.width = "24px";
        icon.style.height = "24px";
        icon.style.borderRadius = "999px";
        icon.style.objectFit = "cover";
        icon.style.backgroundColor = "#0f172a";

        var lbl = document.createElement("span");
        lbl.textContent = bData.name;
        lbl.style.whiteSpace = "nowrap";
        lbl.style.overflow = "hidden";
        lbl.style.textOverflow = "ellipsis";

        left.appendChild(icon);
        left.appendChild(lbl);
        itemBtn.appendChild(left);

        itemBtn.addEventListener("click", function () {
          var brandKey = itemBtn.getAttribute("data-brand-key");
          brandSelect.value = brandKey;

          var evt;
          if (typeof Event === "function") {
            evt = new Event("change", { bubbles: true });
          } else {
            evt = document.createEvent("Event");
            evt.initEvent("change", true, true);
          }
          brandSelect.dispatchEvent(evt);

          if (brandPickerBtn && brandPickerIcon && brandPickerLabel) {
            var chosenBrand = brandsMap[brandKey] || brandsMap[Object.keys(brandsMap)[0]];
            if (chosenBrand) {
              brandPickerIcon.src = chosenBrand.icon || chosenBrand.img;
              brandPickerIcon.alt = chosenBrand.name;
              brandPickerLabel.textContent = chosenBrand.name;
            } else {
              brandPickerLabel.textContent = "неизбрана";
            }
          }

          closeBrandModal();
        });

        brandModalList.appendChild(itemBtn);
      });

      dialog.appendChild(headerRow);
      dialog.appendChild(brandModalList);
      brandModal.appendChild(dialog);
      document.body.appendChild(brandModal);
    }

    // ------------------------------------------
    // Бутон–чип над селекта
    // ------------------------------------------
    brandPickerBtn = document.createElement("button");
    brandPickerBtn.type = "button";
    brandPickerBtn.style.display = "inline-flex";
    brandPickerBtn.style.alignItems = "center";
    brandPickerBtn.style.gap = "6px";
    brandPickerBtn.style.padding = "6px 10px";
    brandPickerBtn.style.borderRadius = "999px";
    brandPickerBtn.style.border = "1px solid #4b5563";
    brandPickerBtn.style.background = "#020617";
    brandPickerBtn.style.fontSize = "13px";
    brandPickerBtn.style.cursor = "pointer";
    brandPickerBtn.style.marginBottom = "6px";
    brandPickerBtn.style.color = "#e5e7eb";

    brandPickerIcon = document.createElement("img");
    brandPickerIcon.style.width = "20px";
    brandPickerIcon.style.height = "20px";
    brandPickerIcon.style.borderRadius = "999px";
    brandPickerIcon.style.objectFit = "cover";
    brandPickerIcon.style.backgroundColor = "#0f172a";

    brandPickerLabel = document.createElement("span");
    brandPickerLabel.style.whiteSpace = "nowrap";
    brandPickerLabel.style.overflow = "hidden";
    brandPickerLabel.style.textOverflow = "ellipsis";

    var initialBrand = brandsMap[settings.brand] || brandsMap[Object.keys(brandsMap)[0]];
    if (initialBrand) {
      brandPickerIcon.src = initialBrand.icon || initialBrand.img;
      brandPickerIcon.alt = initialBrand.name;
      brandPickerLabel.textContent = initialBrand.name;
    } else {
      brandPickerLabel.textContent = "Изберете";
    }

    brandPickerBtn.appendChild(brandPickerIcon);
    brandPickerBtn.appendChild(brandPickerLabel);

    brandPickerBtn.addEventListener("click", function () {
      openBrandModal();
    });

    if (brandSelect.parentNode) {
      brandSelect.parentNode.insertBefore(brandPickerBtn, brandSelect);
      brandSelect.style.display = "none";
    }

    // ------------------------------------------
    // Корекция на състоянието при промяна на броя редове
    // ------------------------------------------
    function adjustGridStateForRowChange(newRows) {
      if (newRows <= 0) return;

      var raw = null;
      try {
        raw = JSON.parse(localStorage.getItem(GRID_STORAGE_KEY) || "null");
      } catch (e) {
        raw = null;
      }

      var MAX_ROWS = newRows;
      var NUM_DAYS = 7;
      var newTimes = [];
      var newFlags = [];

      if (!raw || !raw.times || !Array.isArray(raw.times)) {
        // Няма предишни – инициализираме от DEFAULT_TIMES_MAP
        for (var r = 0; r < MAX_ROWS; r++) {
          newTimes[r] = [];
          for (var d = 0; d < NUM_DAYS; d++) {
            var base = DEFAULT_TIMES_MAP[MAX_ROWS] && DEFAULT_TIMES_MAP[MAX_ROWS][r]
              ? DEFAULT_TIMES_MAP[MAX_ROWS][r][0]
              : "12:00";
            newTimes[r][d] = base;
          }
          newFlags[r] = [0, 0, 0, 0, 0, 0, 0];
        }
      } else {
        var oldTimes = raw.times;
        var oldRows = oldTimes.length;
        for (var r2 = 0; r2 < MAX_ROWS; r2++) {
          newTimes[r2] = [];
          newFlags[r2] = [0, 0, 0, 0, 0, 0, 0];
          for (var d2 = 0; d2 < NUM_DAYS; d2++) {
            if (r2 < oldRows && Array.isArray(oldTimes[r2]) && typeof oldTimes[r2][d2] === "string") {
              newTimes[r2][d2] = oldTimes[r2][d2];
            } else {
              var base2 = DEFAULT_TIMES_MAP[MAX_ROWS] && DEFAULT_TIMES_MAP[MAX_ROWS][r2]
                ? DEFAULT_TIMES_MAP[MAX_ROWS][r2][0]
                : "12:00";
              newTimes[r2][d2] = base2;
            }
          }
        }
      }

      // Лека нормализация – гарантираме, че времето е в 00:00–23:59 и е сортирано по редове
      var MAX_MIN = 23 * 60 + 59;
      for (var day = 0; day < NUM_DAYS; day++) {
        var mins = [];
        for (var rr = 0; rr < MAX_ROWS; rr++) {
          mins[rr] = timeStrToMin(newTimes[rr][day]);
        }
        mins.sort(function (a, b) { return a - b; });
        for (var rr2 = 0; rr2 < MAX_ROWS; rr2++) {
          var clamped = mins[rr2];
          if (clamped < 0) clamped = 0;
          if (clamped > MAX_MIN) clamped = MAX_MIN;
          newTimes[rr2][day] = minToTimeStr(clamped);
        }
      }

      var newState = {
        times: newTimes,
        flag: newFlags,
        todayDow: raw && typeof raw.todayDow === "number" ? raw.todayDow : (new Date()).getDay(),
        activeDow: raw && typeof raw.activeDow === "number" ? raw.activeDow : (new Date()).getDay()
      };

      try {
        localStorage.setItem(GRID_STORAGE_KEY, JSON.stringify(newState));
      } catch (e2) { }
    }

    // ------------------------------------------
    // UI – обновяване според settings
    // ------------------------------------------
    function updateUI(showConfig) {
      var brandKey = settings.brand;
      if (!brandsMap[brandKey]) {
        brandKey = Object.keys(brandsMap)[0];
        settings.brand = brandKey;
      }

      brandSelect.value = brandKey;
      var brandData = brandsMap[brandKey] || brandsMap[Object.keys(brandsMap)[0]];
      var currentName = brandData.name;

      var isConfigured = settings.rows > 0;

      if (settings.brand === "custom") {
        if (settings.customName) {
          currentName = settings.customName;
        } else if (nameInput && nameInput.placeholder) {
          currentName = nameInput.placeholder;
        }
      }

      // Обновяване на капката–чип
      if (brandPickerIcon && brandPickerLabel) {
        var uiBrand = brandsMap[brandKey] || brandsMap[Object.keys(brandsMap)[0]];
        if (uiBrand) {
          brandPickerIcon.src = uiBrand.icon || uiBrand.img;
          brandPickerIcon.alt = uiBrand.name;
          brandPickerLabel.textContent = uiBrand.name;
        } else {
          brandPickerLabel.textContent = "Изберете";
        }
      }

      // Слайдер
      if (isConfigured) {
        slider.value = String(settings.rows);
      } else {
        slider.value = "3";
      }
      sliderVal.textContent = slider.value;
      updateSliderFill();

      // Custom име
      if (brandKey === "custom") {
        customNameField.style.display = "block";
        nameInput.value = settings.customName || "";
        if (settings.customName) {
          currentName = settings.customName;
        } else if (nameInput.placeholder) {
          currentName = nameInput.placeholder;
        }
      } else {
        customNameField.style.display = "none";
        nameInput.value = "";
      }

      if (isConfigured) {
        if (productImg && brandData.img) {
          productImg.src = brandData.img;
          productImg.alt = currentName;
          productImg.style.display = "block";

          // НЕ пипаме стиловете – идват от .prod-img в CSS
          productImg.style.width = "";
          productImg.style.height = "";
          productImg.style.borderRadius = "";
          productImg.style.objectFit = "";
          productImg.style.clipPath = "";
        }
        if (capMain) {
          capMain.classList.add("configured");
        }
        if (capBrand) {
          capBrand.textContent = currentName;
        }
        gridContainer.style.display = "block";

        if (!currentGridInstance && gridContainer.innerHTML.replace(/\s+/g, "") === "") {
          generateGrid(settings.rows, currentName);
        }

        if (intakeBtn) {
          intakeBtn.style.display = "inline-flex";
        }
      } else {
        if (productImg) {
          productImg.style.display = "none";
          productImg.style.width = "";
          productImg.style.height = "";
          productImg.style.borderRadius = "";
          productImg.style.objectFit = "";
          productImg.style.clipPath = "";
        }
        if (capMain) {
          capMain.classList.remove("configured");
        }
        if (capBrand) {
          capBrand.textContent = "";
        }
        gridContainer.style.display = "none";
        gridContainer.innerHTML = "";

        if (intakeBtn) {
          intakeBtn.style.display = "none";
          intakeBtn.removeAttribute("data-row");
          intakeBtn.removeAttribute("data-dow");
        }

        if (currentGridInstance) {
          if (Array.isArray(window.grids)) {
            window.grids = window.grids.filter(function (g) {
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

    // ------------------------------------------
    // Запис + евентуално регенериране на мрежата
    // ------------------------------------------
    function saveAndRerender(showConfig, needsGridUpdate, newRowsForGrid) {
      if (showConfig === void 0) showConfig = false;
      if (needsGridUpdate === void 0) needsGridUpdate = false;

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch (e) { }

      var brandData = brandsMap[settings.brand] || brandsMap["custom"];
      var currentName = brandData.name;

      if (settings.brand === "custom") {
        if (settings.customName) {
          currentName = settings.customName;
        } else if (nameInput.placeholder) {
          currentName = nameInput.placeholder;
        }
      }

      if (typeof newRowsForGrid === "number" && newRowsForGrid > 0) {
        adjustGridStateForRowChange(newRowsForGrid);
      }

      if (needsGridUpdate) {
        generateGrid(settings.rows, currentName);
      }

      updateUI(showConfig);

      if (typeof window.masterUpdateAllGrids === "function") {
        window.masterUpdateAllGrids();
      }
    }

    // ------------------------------------------
    // Създаване на таблица и ProductGrid
    // ------------------------------------------
    function generateGrid(rowCount, productName) {
      if (currentGridInstance) {
        if (Array.isArray(window.grids)) {
          window.grids = window.grids.filter(function (g) {
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

      var defaultTimes = [];
      var timesMap = DEFAULT_TIMES_MAP[rowCount] || DEFAULT_TIMES_MAP[1];

      for (var i = 0; i < rowCount; i++) {
        var base = timesMap[i] && timesMap[i][0] ? timesMap[i][0] : "12:00";
        defaultTimes[i] = [];
        for (var d = 0; d < 7; d++) {
          defaultTimes[i][d] = base;
        }
      }

      var tableId = prefix + "-table";
      var buttonId = "btnProgIntake" + prefix.toUpperCase();

      var rowsHtml = "";
      for (var r = 0; r < rowCount; r++) {
        rowsHtml += "<tr>";
        for (var day = 1; day <= 7; day++) {
          var dow = (day === 7) ? 0 : day;
          var timeIndex = (dow === 0) ? 6 : (dow - 1);
          var cellTime = defaultTimes[r][timeIndex];
          rowsHtml += '<td class="pl-time-cell" data-row="' + r + '" data-dow="' + dow + '">' +
            cellTime +
            "</td>";
        }
        rowsHtml += "</tr>";
      }

      var tableHtml = ""
        + '<table class="pl-table" id="' + tableId + '">'
        + "<thead>"
        + "<tr>"
        + '<th class="pl-day" data-dow="1">Пн</th>'
        + '<th class="pl-day" data-dow="2">Вт</th>'
        + '<th class="pl-day" data-dow="3">Ср</th>'
        + '<th class="pl-day" data-dow="4">Чт</th>'
        + '<th class="pl-day" data-dow="5">Пт</th>'
        + '<th class="pl-day weekend" data-dow="6">Сб</th>'
        + '<th class="pl-day weekend" data-dow="0">Нд</th>'
        + "</tr>"
        + "</thead>"
        + "<tbody>"
        + rowsHtml
        + "</tbody>"
        + "</table>";

      gridContainer.innerHTML = tableHtml;
      gridContainer.style.display = "block";

      setTimeout(function () {
        if (typeof createProductGrid !== "function") {
          console.error("createProductGrid не е заредена!");
          return;
        }

        currentGridInstance = createProductGrid({
          tableId: tableId,
          buttonId: buttonId,
          storageKey: GRID_STORAGE_KEY,
          defaultTimes: defaultTimes,
          productName: productName,
          blockId: prefix + "-block"
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

    // ------------------------------------------
    // СЪБИТИЯ
    // ------------------------------------------

    head.classList.add("clickable");

    // Клик по заглавието – конфигурация само ако НЯМА избрана марка
    head.addEventListener("click", function () {
      if (settings.rows > 0) {
        return;
      }
      var isHidden =
        configDiv.style.display === "none" ||
        configDiv.style.display === "";
      configDiv.style.display = isHidden ? "block" : "none";
    });

    // Дълго натискане – редакция на вече избрана марка
    attachLongPress(head, function () {
      if (settings.rows === 0) {
        configDiv.style.display = "block";
        return;
      }
      var isHidden =
        configDiv.style.display === "none" ||
        configDiv.style.display === "";
      configDiv.style.display = isHidden ? "block" : "none";
    }, 550);

    brandSelect.addEventListener("change", function () {
      var selectedBrand = brandSelect.value;
      if (selectedBrand === "custom") {
        customNameField.style.display = "block";
      } else {
        customNameField.style.display = "none";
      }
    });

    slider.addEventListener("input", function () {
      sliderVal.textContent = slider.value;
      updateSliderFill();
    });

    saveBtn.addEventListener("click", function () {
      var newRows = parseInt(slider.value, 10);
      var newBrand = brandSelect.value;
      var newCustomName = newBrand === "custom" ? (nameInput.value || "").trim() : "";

      var rowsChanged = newRows !== settings.rows;
      var brandChanged = newBrand !== settings.brand;
      var nameChanged = newCustomName !== settings.customName;

      settings.rows = newRows;
      settings.brand = newBrand;
      settings.customName = newCustomName;

      var needsGridUpdate = rowsChanged || brandChanged || nameChanged;
      var newRowsForGrid = rowsChanged && newRows > 0 ? newRows : null;

      saveAndRerender(false, needsGridUpdate, newRowsForGrid);
    });

    deleteBtn.addEventListener("click", function () {
      if (settings.rows === 0) {
        configDiv.style.display = "none";
        return;
      }

      showDeleteConfirm(
        "Ще изтриеш ли Марката?",
        function () {
          settings.rows = 0;
          settings.customName = "";

          if (intakeBtn) {
            intakeBtn.style.display = "none";
            intakeBtn.removeAttribute("data-row");
            intakeBtn.removeAttribute("data-dow");
          }

          saveAndRerender(false, true, null);
        }
      );
    });

    // Първоначално обновяване
    updateUI(false);
  }

  // ============================================
  // ИНИЦИАЛИЗАЦИЯ ЗА 3-те ДОПЪЛНИТЕЛНИ ПРОДУКТА
  // ============================================

  // Берберин
  createConfigurableProduct("ber", BERBERINE_BRANDS);

  // Глюкоманан
  createConfigurableProduct("glu", GLUCOMANNAN_BRANDS);

  // EGCg (Зелен чай)
  createConfigurableProduct("egc", EGCG_BRANDS);

})();
