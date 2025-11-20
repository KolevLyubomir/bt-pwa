/* global createProductGrid, ModalLogic */

(function() {
  "use strict";

  // Данни за марките Берберин
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
    [["08:00"], ["19:00"]],                           // 2
    [["08:00"], ["13:00"], ["19:00"]],                // 3
    [["08:00"], ["12:00"], ["16:00"], ["20:00"]],     // 4
    [["07:00"], ["10:00"], ["13:00"], ["16:00"], ["19:00"]], // 5
    [["07:00"], ["10:00"], ["13:00"], ["16:00"], ["19:00"], ["22:00"]] // 6
  ];

  function createConfigurableProduct(prefix, brandsMap) {
    const configDiv       = document.getElementById(prefix + "-config");
    const nameInput       = document.getElementById(prefix + "-name");
    const slider          = document.getElementById(prefix + "-slider");
    const sliderVal       = document.getElementById(prefix + "-slider-val");
    const sliderTrackFill = document.getElementById(prefix + "-slider-track-fill");
    const saveBtn         = document.getElementById(prefix + "-save");
    const deleteBtn       = document.getElementById(prefix + "-delete");
    const gridContainer   = document.getElementById(prefix + "-grid-container");
    const capMain         = document.getElementById(prefix + "-cap-main");
    const capBrand        = document.getElementById(prefix + "-cap-brand");
    const head            = document.getElementById(prefix + "-head");
    const brandSelect     = document.getElementById(prefix + "-brand-select");
    const customNameField = document.getElementById(prefix + "-custom-name-field");
    const productImg      = document.getElementById(prefix + "-img");
    const intakeBtn       = document.getElementById("btnProgIntake" + prefix.toUpperCase());

    if (!configDiv || !slider || !saveBtn || !gridContainer || !head || !brandSelect) {
      console.error("Липсващи елементи за " + prefix);
      return;
    }

    const STORAGE_KEY = "bt_add_" + prefix + "_v310";

    let currentGridInstance = null;

    let settings = {
      brand: Object.keys(brandsMap)[0],
      customName: "",
      rows: 0
    };

    // Детектор: touch устройство или не
    const isTouchDevice =
      ("ontouchstart" in window) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);

    // Long press helper – за touch устройства
    function attachLongPress(el, onLongPress, delayMs) {
      if (!el) return;
      const delay = typeof delayMs === "number" ? delayMs : 450; // малко по-кратко
      let timer = null;
      let startX = 0;
      let startY = 0;
      const MAX_MOVE = 40; // позволяваме повече мърдане

      function clearTimer() {
        if (timer !== null) {
          clearTimeout(timer);
          timer = null;
        }
      }

      function start(e) {
        clearTimer();
        const pt = e.touches ? e.touches[0] : e;
        startX = pt.clientX;
        startY = pt.clientY;
        timer = setTimeout(function() {
          timer = null;
          onLongPress();
        }, delay);
      }

      function move(e) {
        if (timer === null) return;
        const pt = e.touches ? e.touches[0] : e;
        const dx = Math.abs(pt.clientX - startX);
        const dy = Math.abs(pt.clientY - startY);
        if (dx > MAX_MOVE || dy > MAX_MOVE) {
          clearTimer();
        }
      }

      function cancel() {
        clearTimer();
      }

      el.addEventListener("touchstart", start, { passive: true });
      el.addEventListener("touchmove", move, { passive: true });
      el.addEventListener("touchend", cancel);
      el.addEventListener("touchcancel", cancel);

      // По желание: за мишка също може да работи като "задържане",
      // но на десктоп ние ще ползваме click, така че оставяме само за touch.
    }

    // Зареждане от localStorage
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved) {
        settings = Object.assign({}, settings, saved);
      }
    } catch (e) {}

    function updateSliderFill() {
      if (!sliderTrackFill) return;
      const min = Number(slider.min || 1);
      const max = Number(slider.max || 6);
      const val = Number(slider.value || 3);
      const percentage = (val - min) / (max - min) * 100;
      sliderTrackFill.style.width = percentage + "%";
    }

    function updateUI(showConfig) {
      if (showConfig === void 0) showConfig = false;

      const isConfigured = settings.rows > 0;
      const brandKey = settings.brand || Object.keys(brandsMap)[0];
      const brandData = brandsMap[brandKey] || brandsMap["custom"];
      let currentName = brandData.name;

      // Панел настройки
      brandSelect.value = brandKey;

      if (isConfigured) {
        slider.value = String(settings.rows);
      } else {
        slider.value = "3";
      }
      sliderVal.textContent = slider.value;
      updateSliderFill();

      if (brandKey === "custom") {
        customNameField.style.display = "block";
        nameInput.value = settings.customName || "";
        if (settings.customName) {
          currentName = settings.customName;
        } else {
          currentName = nameInput.placeholder;
        }
      } else {
        customNameField.style.display = "none";
      }

      // Видимата част
      if (isConfigured) {
        productImg.src = brandData.img;
        productImg.style.display = "block";
        if (capMain) capMain.classList.add("configured");
        if (capBrand) capBrand.textContent = currentName;
        gridContainer.style.display = "block";

        if (!currentGridInstance) {
          generateGrid(settings.rows, currentName);
        }
      } else {
        productImg.style.display = "none";
        if (capMain) capMain.classList.remove("configured");
        if (capBrand) capBrand.textContent = "";
        gridContainer.style.display = "none";
        gridContainer.innerHTML = "";

        if (currentGridInstance) {
          if (Array.isArray(window.grids)) {
            window.grids = window.grids.filter(function(g) { return g !== currentGridInstance; });
          }
          if (typeof currentGridInstance.destroy === "function") {
            currentGridInstance.destroy();
          }
          currentGridInstance = null;
        }
      }

      configDiv.style.display = showConfig ? "block" : "none";
    }

    // --- Събития за хедъра (Берберин) ---

    head.classList.add("clickable");

    // На touch → long press (задържане)
    if (isTouchDevice) {
      attachLongPress(head, function() {
        const isHidden =
          configDiv.style.display === "none" ||
          configDiv.style.display === "";
        configDiv.style.display = isHidden ? "block" : "none";
      }, 450);
    } else {
      // На десктоп → обикновен click
      head.addEventListener("click", function() {
        const isHidden =
          configDiv.style.display === "none" ||
          configDiv.style.display === "";
        configDiv.style.display = isHidden ? "block" : "none";
      });
    }

    brandSelect.addEventListener("change", function() {
      const selectedBrand = brandSelect.value;
      if (selectedBrand === "custom") {
        customNameField.style.display = "block";
      } else {
        customNameField.style.display = "none";
      }
    });

    slider.addEventListener("input", function() {
      sliderVal.textContent = slider.value;
      updateSliderFill();
    });

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

    deleteBtn.addEventListener("click", function() {
      if (settings.rows === 0) {
        configDiv.style.display = "none";
        return;
      }
      if (!confirm("Ще изтриете ли избора?")) {
        return;
      }
      settings.rows = 0;
      settings.customName = "";
      saveAndRerender(false, true);
    });

    function saveAndRerender(showConfig, needsGridUpdate) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

      const brandData = brandsMap[settings.brand] || brandsMap["custom"];
      let currentName = brandData.name;

      if (settings.brand === "custom") {
        if (settings.customName) {
          currentName = settings.customName;
        } else {
          currentName = nameInput.placeholder;
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

    function generateGrid(rowCount, productName) {
      if (currentGridInstance) {
        if (Array.isArray(window.grids)) {
          window.grids = window.grids.filter(function(g) { return g !== currentGridInstance; });
        }
        if (typeof currentGridInstance.destroy === "function") {
          currentGridInstance.destroy();
        }
        currentGridInstance = null;
      }

      if (rowCount === 0) {
        gridContainer.innerHTML = "";
        if (intakeBtn) {
          intakeBtn.style.display = "none";
        }
        return;
      }

      const defaultTimes = [];
      const timesMap = DEFAULT_TIMES_MAP[rowCount] || DEFAULT_TIMES_MAP[1];

      for (let i = 0; i < rowCount; i++) {
        const time = (timesMap[i] && timesMap[i][0]) || "12:00";
        defaultTimes.push(Array(7).fill(time));
      }

      const tableId  = prefix + "-table";
      const buttonId = "btnProgIntake" + prefix.toUpperCase();

      let tbodyHtml = "";
      for (let r = 0; r < rowCount; r++) {
        tbodyHtml += "<tr>";
        for (let d = 1; d <= 7; d++) {
          const dow = d === 7 ? 0 : d;
          const timeIndex = dow === 0 ? 6 : dow - 1;
          const cellTime = defaultTimes[r][timeIndex];
          tbodyHtml +=
            '<td class="pl-time-cell" data-row="' +
            r +
            '" data-dow="' +
            dow +
            '">' +
            cellTime +
            "</td>";
        }
        tbodyHtml += "</tr>";
      }

      gridContainer.innerHTML =
        '<table class="pl-table" id="' + tableId + '">' +
          "<thead>" +
            "<tr>" +
              '<th class="pl-day" data-dow="1">Пn</th>' +
              '<th class="pl-day" data-dow="2">Вт</th>' +
              '<th class="pl-day" data-dow="3">Ср</th>' +
              '<th class="pl-day" data-dow="4">Чт</th>' +
              '<th class="pl-day" data-dow="5">Пт</th>' +
              '<th class="pl-day weekend" data-dow="6">Сб</th>' +
              '<th class="pl-day weekend" data-dow="0">Нд</th>' +
            "</tr>" +
          "</thead>" +
          "<tbody>" +
            tbodyHtml +
          "</tbody>" +
        "</table>";

      setTimeout(function() {
        if (typeof createProductGrid !== "function") {
          console.error("createProductGrid не е заредена!");
          return;
        }

        currentGridInstance = createProductGrid({
          tableId: tableId,
          buttonId: buttonId,
          storageKey: "bt_grid_" + prefix + "_v310",
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

    // Старт
    updateUI(false);
  }

  // Инициализация – засега само Берберин
  createConfigurableProduct("ber", BERBERINE_BRANDS);
})();
