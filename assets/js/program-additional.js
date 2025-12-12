/* global createProductGrid */

(function () {
  "use strict";

  // ============================================
  // БРАНДОВЕ – КАРТИ С КАРТИНКИ
  // ============================================

  const BERBERINE_BRANDS = {
    thorne: {
      name: "Thorne Research",
      img: "assets/products/additional/ber-thorne.webp",
      icon: "assets/products/additional/icons/ber-thorne-icon.webp"
    },
    toniiq: {
      name: "Toniiq - Ultra High Strength",
      img: "assets/products/additional/ber-toniiq.webp",
      icon: "assets/products/additional/icons/ber-toniiq-icon.webp"
    },
    it: {
      name: "Integrative Therapeutics",
      img: "assets/products/additional/ber-it.webp",
      icon: "assets/products/additional/icons/ber-it-icon.webp"
    },
    nutricost: {
      name: "Nutricost",
      img: "assets/products/additional/ber-nutricost.webp",
      icon: "assets/products/additional/icons/ber-nutricost-icon.webp"
    },
    now: {
      name: "NOW Foods - Berberine Glucose",
      img: "assets/products/additional/ber-now.webp",
      icon: "assets/products/additional/icons/ber-now-icon.webp"
    },
    custom: {
      name: "Друго (въведи):",
      img: "assets/products/additional/ber-custom.webp",
      icon: "assets/products/additional/icons/ber-custom-icon.webp"
    }
  };

  const GLUCOMANNAN_BRANDS = {
    now: {
      name: "NOW Foods - Glucomannan",
      img: "assets/products/additional/glu-now.webp",
      icon: "assets/products/additional/icons/glu-now-icon.webp"
    },
    swanson: {
      name: "Swanson Glucomannan",
      img: "assets/products/additional/glu-swanson.webp",
      icon: "assets/products/additional/icons/glu-swanson-icon.webp"
    },
    jarrow: {
      name: "Jarrow Formulas Glucomannan",
      img: "assets/products/additional/glu-jarrow.webp",
      icon: "assets/products/additional/icons/glu-jarrow-icon.webp"
    },
    lifeext: {
      name: "Life Extension Glucomannan",
      img: "assets/products/additional/glu-lifeext.webp",
      icon: "assets/products/additional/icons/glu-lifeext-icon.webp"
    },
    custom: {
      name: "Друго (въведи):",
      img: "assets/products/additional/glu-custom.webp",
      icon: "assets/products/additional/icons/glu-custom-icon.webp"
    }
  };

  const EGCG_BRANDS = {
    now: {
      name: "NOW Foods - EGCg Green Tea",
      img: "assets/products/additional/egc-now.webp",
      icon: "assets/products/additional/icons/egc-now-icon.webp"
    },
    lifeext: {
      name: "Life Extension Mega Green Tea Extract",
      img: "assets/products/additional/egc-lifeext.webp",
      icon: "assets/products/additional/icons/egc-lifeext-icon.webp"
    },
    jarrow: {
      name: "Jarrow Green Tea 500mg",
      img: "assets/products/additional/egc-jarrow.webp",
      icon: "assets/products/additional/icons/egc-jarrow-icon.webp"
    },
    swanson: {
      name: "Swanson Green Tea Extract",
      img: "assets/products/additional/egc-swanson.webp",
      icon: "assets/products/additional/icons/egc-swanson-icon.webp"
    },
    custom: {
      name: "Друго (въведи):",
      img: "assets/products/additional/egc-custom.webp",
      icon: "assets/products/additional/icons/egc-custom-icon.webp"
    }
  };

  // ============================================
  // СХЕМА НА ЧАСОВЕТЕ (ТВОЯТА СХЕМА)
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

  // ============================================
  // КОНФИГУРИРУЕМ ПРОДУКТ
  // ============================================

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
    var settingsBtn     = document.getElementById(prefix + "-settings-btn");

    if (!configDiv || !slider || !saveBtn || !gridContainer || !head || !brandSelect) {
      console.error("Липсващи елементи за " + prefix);
      return;
    }

    var STORAGE_KEY      = "bt_add_" + prefix + "_v310";
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

    var gearSvg = settingsBtn ? settingsBtn.innerHTML : "";
    var closeSvg = (
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="none"' +
      ' stroke="#f97373" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M6 6l12 12M18 6L6 18"></path>' +
      "</svg>"
    );

    function refreshSettingsIcon() {
      if (!settingsBtn) return;
      if (settings.rows === 0 || settingsBtn.style.display === "none") {
        settingsBtn.innerHTML = gearSvg;
        return;
      }
      var isVisible = configDiv.style.display !== "none" && configDiv.style.display !== "";
      settingsBtn.innerHTML = isVisible ? closeSvg : gearSvg;
    }

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
        if (backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
      }
      btnCancel.addEventListener("click", close);
      btnOk.addEventListener("click", function () { close(); if (typeof onConfirm === "function") onConfirm(); });
      backdrop.addEventListener("click", function (e) { if (e.target === backdrop) close(); });
    }

    // -------- Модал за избор на марка --------
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
      if (brandModal) brandModal.style.display = "none";
    }

    function buildBrandModal() {
      brandModal = document.createElement("div");
      brandModal.id = prefix + "-brand-modal";
      Object.assign(brandModal.style, { position: "fixed", inset: "0", background: "rgba(0,0,0,0.45)", display: "none", alignItems: "center", justifyContent: "center", zIndex: "9999" });

      var dialog = document.createElement("div");
      Object.assign(dialog.style, { background: "#020617", borderRadius: "20px", padding: "18px 20px", width: "92%", maxWidth: "360px", maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 18px 45px rgba(0,0,0,0.65)", border: "1px solid #1f2937", fontFamily: "system-ui" });

      var headerRow = document.createElement("div");
      Object.assign(headerRow.style, { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" });

      brandModalTitle = document.createElement("div");
      var headerName = (capMain && capMain.textContent) ? capMain.textContent : "марка";
      brandModalTitle.textContent = "Избор на " + headerName;
      Object.assign(brandModalTitle.style, { fontSize: "15px", fontWeight: "600", color: "#f9fafb" });

      var closeX = document.createElement("button");
      closeX.type = "button";
      closeX.textContent = "×";
      Object.assign(closeX.style, { border: "none", background: "transparent", fontSize: "20px", lineHeight: "1", cursor: "pointer", color: "#9ca3af" });
      closeX.addEventListener("click", closeBrandModal);

      headerRow.appendChild(brandModalTitle);
      headerRow.appendChild(closeX);

      brandModalList = document.createElement("div");
      Object.assign(brandModalList.style, { display: "flex", flexDirection: "column", gap: "8px", overflowY: "auto", paddingRight: "4px", marginTop: "4px" });

      Object.keys(brandsMap).forEach(function (key) {
        var bData = brandsMap[key];
        var itemBtn = document.createElement("button");
        itemBtn.type = "button";
        itemBtn.setAttribute("data-brand-key", key);
        Object.assign(itemBtn.style, { display: "flex", alignItems: "center", width: "100%", borderRadius: "999px", border: "1px solid #334155", padding: "8px 10px", background: "#020617", cursor: "pointer", fontSize: "13px", justifyContent: "flex-start", color: "#e5e7eb" });

        var left = document.createElement("div");
        Object.assign(left.style, { display: "flex", alignItems: "center", gap: "8px" });

        var icon = document.createElement("img");
        icon.src = bData.icon || bData.img;
        icon.alt = bData.name;
        Object.assign(icon.style, { width: "24px", height: "24px", borderRadius: "999px", objectFit: "cover", backgroundColor: "#0f172a" });

        var lbl = document.createElement("span");
        lbl.textContent = bData.name;
        Object.assign(lbl.style, { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" });

        left.appendChild(icon);
        left.appendChild(lbl);
        itemBtn.appendChild(left);

        itemBtn.addEventListener("click", function () {
          var brandKey = itemBtn.getAttribute("data-brand-key");
          brandSelect.value = brandKey;
          var evt = document.createEvent("Event"); evt.initEvent("change", true, true); brandSelect.dispatchEvent(evt);

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

    brandPickerBtn = document.createElement("button");
    brandPickerBtn.type = "button";
    Object.assign(brandPickerBtn.style, { display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 10px", borderRadius: "999px", border: "1px solid #4b5563", background: "#020617", fontSize: "13px", cursor: "pointer", marginBottom: "6px", color: "#e5e7eb" });

    brandPickerIcon = document.createElement("img");
    Object.assign(brandPickerIcon.style, { width: "20px", height: "20px", borderRadius: "999px", objectFit: "cover", backgroundColor: "#0f172a" });

    brandPickerLabel = document.createElement("span");
    Object.assign(brandPickerLabel.style, { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" });

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
    brandPickerBtn.addEventListener("click", openBrandModal);

    if (brandSelect.parentNode) {
      brandSelect.parentNode.insertBefore(brandPickerBtn, brandSelect);
      brandSelect.style.display = "none";
    }

    // --- ПОПРАВКА: ВИНАГИ НАЛАГАМЕ СХЕМАТА ---
    function adjustGridStateForRowChange(newRows) {
      if (newRows <= 0) return;
      
      // Взимаме картата за този брой редове (напр. 5 реда -> индекс 5)
      var mapForRows = DEFAULT_TIMES_MAP[newRows];
      if (!mapForRows) mapForRows = DEFAULT_TIMES_MAP[1]; // fallback

      var NUM_DAYS = 7;
      var newTimes = []; 
      var newFlags = [];

      // Генерираме чисто нови времена според схемата
      for (var r = 0; r < newRows; r++) {
        newTimes[r] = [];
        newFlags[r] = [0, 0, 0, 0, 0, 0, 0];
        
        // Взимаме часа от схемата (напр. "10:00" за втория ред при 5 реда)
        var timeStr = (mapForRows[r] && mapForRows[r][0]) ? mapForRows[r][0] : "12:00";
        
        for (var d = 0; d < NUM_DAYS; d++) {
          newTimes[r][d] = timeStr;
        }
      }

      // Запазваме активния ден
      var raw = null; try { raw = JSON.parse(localStorage.getItem(GRID_STORAGE_KEY) || "null"); } catch (e) { raw = null; }
      
      var newState = {
        times: newTimes, 
        flag: newFlags,
        todayDow: raw && typeof raw.todayDow === "number" ? raw.todayDow : (new Date()).getDay(),
        activeDow: raw && typeof raw.activeDow === "number" ? raw.activeDow : (new Date()).getDay()
      };
      
      try { localStorage.setItem(GRID_STORAGE_KEY, JSON.stringify(newState)); } catch (e2) { }
    }

    function updateUI(showConfig) {
      var brandKey = settings.brand;
      if (!brandsMap[brandKey]) { brandKey = Object.keys(brandsMap)[0]; settings.brand = brandKey; }
      brandSelect.value = brandKey;
      var brandData = brandsMap[brandKey] || brandsMap[Object.keys(brandsMap)[0]];
      var currentName = brandData.name;
      var isConfigured = settings.rows > 0;

      if (settings.brand === "custom") {
        if (settings.customName) currentName = settings.customName;
        else if (nameInput && nameInput.placeholder) currentName = nameInput.placeholder;
      }

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

      slider.value = isConfigured ? String(settings.rows) : "3";
      sliderVal.textContent = slider.value;
      updateSliderFill();

      if (brandKey === "custom") {
        customNameField.style.display = "block";
        nameInput.value = settings.customName || "";
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
        if (capMain) capMain.classList.add("configured");
        if (capBrand) capBrand.textContent = currentName;
        gridContainer.style.display = "block";

        if (!currentGridInstance && gridContainer.innerHTML.replace(/\s+/g, "") === "") {
          generateGrid(settings.rows, currentName);
        }

        if (intakeBtn) intakeBtn.style.display = "inline-flex";
        if (settingsBtn) settingsBtn.style.display = "inline-flex";
      } else {
        var defBrand = brandsMap["custom"];
        if (productImg && defBrand && defBrand.img) {
          productImg.src = defBrand.img;
          productImg.style.display = "block";
          productImg.alt = "Неконфигуриран";
        } else if (productImg) {
          productImg.style.display = "none";
        }

        if (capMain) capMain.classList.remove("configured");
        if (capBrand) capBrand.textContent = "";
        gridContainer.style.display = "none";
        gridContainer.innerHTML = "";

        if (intakeBtn) { intakeBtn.style.display = "none"; intakeBtn.removeAttribute("data-row"); intakeBtn.removeAttribute("data-dow"); }
        if (settingsBtn) settingsBtn.style.display = "none";

        if (currentGridInstance) {
          if (Array.isArray(window.grids)) window.grids = window.grids.filter(g => g !== currentGridInstance);
          if (typeof currentGridInstance.destroy === "function") currentGridInstance.destroy();
          currentGridInstance = null;
        }
      }
      configDiv.style.display = showConfig ? "block" : "none";
      refreshSettingsIcon();
    }

    function saveAndRerender(showConfig, needsGridUpdate, newRowsForGrid) {
      if (showConfig === void 0) showConfig = false;
      if (needsGridUpdate === void 0) needsGridUpdate = false;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (e) {}

      var brandData = brandsMap[settings.brand] || brandsMap.custom;
      var currentName = brandData ? brandData.name : "";
      if (settings.brand === "custom") {
        if (settings.customName) currentName = settings.customName;
        else if (nameInput && nameInput.placeholder) currentName = nameInput.placeholder;
      }

      if (typeof newRowsForGrid === "number" && newRowsForGrid > 0) adjustGridStateForRowChange(newRowsForGrid);
      if (needsGridUpdate) generateGrid(settings.rows, currentName);

      updateUI(showConfig);
      if (typeof window.masterUpdateAllGrids === "function") window.masterUpdateAllGrids();
    }

    // ===============================================
    // --- ГЕНЕРИРАНЕ С <TEMPLATE> ---
    // ===============================================
    function generateGrid(rowCount, productName) {
      // 1. Почистване
      if (currentGridInstance) {
        if (Array.isArray(window.grids)) window.grids = window.grids.filter(g => g !== currentGridInstance);
        if (typeof currentGridInstance.destroy === "function") currentGridInstance.destroy();
        currentGridInstance = null;
      }
      
      // 2. Скриване ако няма редове
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

      // 3. Данни
      var defaultTimes = [];
      var timesMap = DEFAULT_TIMES_MAP[rowCount] || DEFAULT_TIMES_MAP[1];
      for (var i = 0; i < rowCount; i++) {
        var base = timesMap[i] && timesMap[i][0] ? timesMap[i][0] : "12:00";
        defaultTimes[i] = [];
        for (var d = 0; d < 7; d++) defaultTimes[i][d] = base;
      }

      var tableId = prefix + "-table";
      var buttonId = "btnProgIntake" + prefix.toUpperCase();

      // 4. ИЗПОЛЗВАНЕ НА ШАБЛОНА
      gridContainer.innerHTML = ""; // Clean
      var tmpl = document.getElementById('tmpl-grid');
      
      if (tmpl) {
          // Клонираме съдържанието
          var clone = tmpl.content.cloneNode(true);
          var table = clone.querySelector('table');
          table.id = tableId;
          
          var tbody = table.querySelector('tbody');
          
          // Генерираме редовете (TR)
          for (var r = 0; r < rowCount; r++) {
              var tr = document.createElement('tr');
              var daysSeq = [1, 2, 3, 4, 5, 6, 0];
              
              daysSeq.forEach(function(dow) {
                  var td = document.createElement('td');
                  td.className = 'pl-time-cell';
                  td.setAttribute('data-row', r);
                  td.setAttribute('data-dow', dow);
                  
                  var idx = (dow === 0 ? 6 : dow - 1);
                  td.textContent = defaultTimes[r][idx];
                  
                  tr.appendChild(td);
              });
              tbody.appendChild(tr);
          }
          gridContainer.appendChild(table);
      } else {
          console.error("Шаблонът #tmpl-grid липсва в HTML!");
          return;
      }
      
      gridContainer.style.display = "block";

      // 5. Инициализация на логиката
      setTimeout(function () {
        if (typeof createProductGrid !== "function") return;
        currentGridInstance = createProductGrid({ 
            tableId: tableId, 
            buttonId: buttonId, 
            storageKey: GRID_STORAGE_KEY, 
            defaultTimes: defaultTimes, 
            productName: productName, 
            blockId: prefix + "-block" 
        });
        
        if (!window.grids) window.grids = [];
        if (currentGridInstance) {
          window.grids.push(currentGridInstance);
          if (typeof currentGridInstance.updateIntakeStates === "function") currentGridInstance.updateIntakeStates();
        }
      }, 0);
    }

    if (head) {
      head.addEventListener("click", function (e) {
        if (settingsBtn && (e.target === settingsBtn || (settingsBtn.contains && settingsBtn.contains(e.target)))) return;
        if (settings.rows === 0) {
          var isHidden = configDiv.style.display === "none" || configDiv.style.display === "";
          configDiv.style.display = isHidden ? "block" : "none";
          refreshSettingsIcon();
        }
      });
    }

    if (settingsBtn) {
      settingsBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        if (settings.rows === 0) return;
        var isHidden = configDiv.style.display === "none" || configDiv.style.display === "";
        configDiv.style.display = isHidden ? "block" : "none";
        refreshSettingsIcon();
      });
    }

    brandSelect.addEventListener("change", function () {
      if (brandSelect.value === "custom") customNameField.style.display = "block"; else customNameField.style.display = "none";
    });

    slider.addEventListener("input", function () { sliderVal.textContent = slider.value; updateSliderFill(); });

    saveBtn.addEventListener("click", function () {
      var newRows = parseInt(slider.value, 10);
      var newBrand = brandSelect.value;
      var newCustomName = newBrand === "custom" ? (nameInput.value || "").trim() : "";
      var rowsChanged = newRows !== settings.rows;
      var brandChanged = newBrand !== settings.brand;
      var nameChanged = newCustomName !== settings.customName;
      settings.rows = newRows; settings.brand = newBrand; settings.customName = newCustomName;
      saveAndRerender(false, rowsChanged || brandChanged || nameChanged, rowsChanged && newRows > 0 ? newRows : null);
    });

    deleteBtn.addEventListener("click", function () {
      if (settings.rows === 0) { configDiv.style.display = "none"; refreshSettingsIcon(); return; }
      showDeleteConfirm("Ще изтриеш ли Марката?", function () {
        settings.rows = 0; settings.customName = "";
        if (intakeBtn) { intakeBtn.style.display = "none"; intakeBtn.removeAttribute("data-row"); intakeBtn.removeAttribute("data-dow"); }
        saveAndRerender(false, true, null);
      });
    });

    updateUI(false);
  }

  createConfigurableProduct("ber", BERBERINE_BRANDS);
  createConfigurableProduct("glu", GLUCOMANNAN_BRANDS);
  createConfigurableProduct("egc", EGCG_BRANDS);

})();