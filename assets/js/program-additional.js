/* global createProductGrid, ModalLogic */

(function() {
  "use strict";

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

  const DEFAULT_TIMES_MAP = [
    [],
    [["12:00"]],
    [["08:00"], ["12:00"]],
    [["08:00"], ["12:00"], ["19:00"]],
    [["08:00"], ["12:00"], ["16:00"], ["19:00"]],
    [["08:00"], ["10:00"], ["12:00"], ["16:00"], ["19:00"]],
    [["08:00"], ["10:00"], ["12:00"], ["16:00"], ["19:00"], ["22:00"]]
  ];

  function timeStrToMin(str) {
    if (!str || typeof str !== "string") return 0;
    var parts = str.split(":");
    var h = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10);
    if (!isFinite(h)) h = 0;
    if (!isFinite(m)) m = 0;
    if (h < 0) h = 0; if (h > 23) h = 23;
    if (m < 0) m = 0; if (m > 59) m = 59;
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

  function createConfigurableProduct(prefix, brandsMap) {
    var configDiv       = document.getElementById(prefix + "-config");
    var nameInput       = document.getElementById(prefix + "-name");
    var slider          = document.getElementById(prefix + "-slider");
    var sliderVal       = document.getElementById(prefix + "-slider-val");
    var sliderTrackFill = document.getElementById(prefix + "-slider-track-fill");
    var saveBtn         = document.getElementById(prefix + "-save");
    var deleteBtn       = document.getElementById(prefix + "-delete");
    var gridContainer   = document.getElementById(prefix + "-grid-container");
    var capMain         = document.getElementById(prefix + "-cap-main");
    var capBrand        = document.getElementById(prefix + "-cap-brand");
    var head            = document.getElementById(prefix + "-head");
    var brandSelect     = document.getElementById(prefix + "-brand-select");
    var customNameField = document.getElementById(prefix + "-custom-name-field");
    var productImg      = document.getElementById(prefix + "-img");
    var intakeBtn       = document.getElementById("btnProgIntake" + prefix.toUpperCase());

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

    try {
      var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved) {
        if (saved.brand) settings.brand = saved.brand;
        if (typeof saved.customName === "string") settings.customName = saved.customName;
        if (typeof saved.rows === "number") settings.rows = saved.rows;
      }
    } catch (e) {}

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

      btnCancel.addEventListener("click", function() {
        close();
      });

      btnOk.addEventListener("click", function() {
        close();
        if (typeof onConfirm === "function") onConfirm();
      });

      backdrop.addEventListener("click", function(e) {
        if (e.target === backdrop) close();
      });
    }

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
        for (var r = 0; r < MAX_ROWS; r++) {
          newTimes[r] = [];
          for (var d = 0; d < NUM_DAYS; d++) {
            var base = DEFAULT_TIMES_MAP[MAX_ROWS] && DEFAULT_TIMES_MAP[MAX_ROWS][r] ?
              DEFAULT_TIMES_MAP[MAX_ROWS][r][0] : "12:00";
            newTimes[r][d] = base;
          }
          newFlags[r] = [0,0,0,0,0,0,0];
        }
      } else {
        var oldTimes = raw.times;
        var oldRows = oldTimes.length;
        for (var r2 = 0; r2 < MAX_ROWS; r2++) {
          newTimes[r2] = [];
          newFlags[r2] = [0,0,0,0,0,0,0];
          for (var d2 = 0; d2 < NUM_DAYS; d2++) {
            if (r2 < oldRows && Array.isArray(oldTimes[r2]) && typeof oldTimes[r2][d2] === "string") {
              newTimes[r2][d2] = oldTimes[r2][d2];
            } else {
              var base2 = DEFAULT_TIMES_MAP[MAX_ROWS] && DEFAULT_TIMES_MAP[MAX_ROWS][r2] ?
                DEFAULT_TIMES_MAP[MAX_ROWS][r2][0] : "12:00";
              newTimes[r2][d2] = base2;
            }
          }
        }
      }

      var MAX_MIN = 23 * 60 + 59;
      for (var day = 0; day < NUM_DAYS; day++) {
        var mins = [];
        for (var rr = 0; rr < MAX_ROWS; rr++) {
          mins[rr] = timeStrToMin(newTimes[rr][day]);
        }
        for (var rr2 = 0; rr2 < MAX_ROWS; rr2++) {
          if (rr2 === 0) {
            if (mins[rr2] < 0) mins[rr2] = 0;
            if (mins[rr2] > MAX_MIN) mins[rr2] = MAX_MIN;
          } else {
            if (mins[rr2] <= mins[rr2 - 1]) {
              mins[rr2] = mins[rr2 - 1] + 1;
              if (mins[rr2] > MAX_MIN) mins[rr2] = MAX_MIN;
            }
          }
        }
        for (var rr3 = 0; rr3 < MAX_ROWS; rr3++) {
          newTimes[rr3][day] = minToTimeStr(mins[rr3]);
        }
      }

      var state = {
        times: newTimes,
        flag: newFlags,
        todayDow: (raw && typeof raw.todayDow === "number") ? raw.todayDow : (new Date()).getDay(),
        activeDow: (raw && typeof raw.activeDow === "number") ? raw.activeDow : (new Date()).getDay()
      };
      try {
        localStorage.setItem(GRID_STORAGE_KEY, JSON.stringify(state));
      } catch (e) {}
    }

    function updateUI(showConfig) {
      if (showConfig === void 0) showConfig = false;

      var isConfigured = settings.rows > 0;
      var brandKey = settings.brand || Object.keys(brandsMap)[0];
      var brandData = brandsMap[brandKey] || brandsMap["custom"];
      var currentName = brandData.name;

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
          currentName = nameInput.placeholder || currentName;
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
      } else {
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

    function saveAndRerender(showConfig, needsGridUpdate, newRowsForGrid) {
      if (showConfig === void 0) showConfig = false;
      if (needsGridUpdate === void 0) needsGridUpdate = false;

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch (e) {}

      var brandData = brandsMap[settings.brand] || brandsMap["custom"];
      var currentName = brandData.name;

      if (settings.brand === "custom") {
        if (settings.customName) {
          currentName = settings.customName;
        } else {
          currentName = nameInput.placeholder || currentName;
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

    function generateGrid(rowCount, productName) {
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
        +   "<thead>"
        +     "<tr>"
        +       '<th class="pl-day" data-dow="1">Пн</th>'
        +       '<th class="pl-day" data-dow="2">Вт</th>'
        +       '<th class="pl-day" data-dow="3">Ср</th>'
        +       '<th class="pl-day" data-dow="4">Чт</th>'
        +       '<th class="pl-day" data-dow="5">Пт</th>'
        +       '<th class="pl-day weekend" data-dow="6">Сб</th>'
        +       '<th class="pl-day weekend" data-dow="0">Нд</th>'
        +     "</tr>"
        +   "</thead>"
        +   "<tbody>"
        +     rowsHtml
        +   "</tbody>"
        + "</table>";

      gridContainer.innerHTML = tableHtml;
      gridContainer.style.display = "block";

      setTimeout(function() {
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

    head.classList.add("clickable");

    head.addEventListener("click", function() {
      if (settings.rows > 0) {
        return;
      }
      var isHidden =
        configDiv.style.display === "none" ||
        configDiv.style.display === "";
      configDiv.style.display = isHidden ? "block" : "none";
    });

    attachLongPress(head, function() {
      if (settings.rows === 0) {
        configDiv.style.display = "block";
        return;
      }
      var isHidden =
        configDiv.style.display === "none" ||
        configDiv.style.display === "";
      configDiv.style.display = isHidden ? "block" : "none";
    }, 550);

    brandSelect.addEventListener("change", function() {
      var selectedBrand = brandSelect.value;
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

          saveAndRerender(false, true, null);
        }
      );
    });

    updateUI(false);
  }

  createConfigurableProduct("ber", BERBERINE_BRANDS);

})();
