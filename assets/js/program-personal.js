/* global createProductGrid */

(function () {
  "use strict";

  // ============================
  // Personal Mode (Личен Режим)
  // v6.0.3
  // ============================

  var STORAGE_KEY = "bt-personal-products";

  // 1..12 default time per row (each row repeats across week)
  // (може да се направи по-умно по-късно, но това е стабилен старт)
  var PERSONAL_DEFAULT_TIME = "08:00";

  function nowTs() { return Date.now(); }

  function uid() {
    return "p_" + nowTs().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }

  function loadAll() {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      var arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function saveAll(arr) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  }

  function findIndexById(arr, id) {
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] && arr[i].id === id) return i;
    }
    return -1;
  }

  function buildDefaultTimes(rows) {
    var times = [];
    for (var r = 0; r < rows; r++) {
      var row = [];
      for (var c = 0; c < 7; c++) row.push(PERSONAL_DEFAULT_TIME);
      times.push(row);
    }
    return times;
  }

  function cloneTemplateGridInto(container, tableId) {
    var tmpl = document.getElementById("tmpl-grid");
    if (!tmpl) {
      console.error("Шаблонът #tmpl-grid липсва в HTML!");
      return null;
    }

    var frag = tmpl.content ? tmpl.content.cloneNode(true) : null;
    if (!frag) return null;

    var holder = document.createElement("div");
    holder.appendChild(frag);

    var table = holder.querySelector("table");
    if (!table) {
      console.error("tmpl-grid няма table елемент!");
      return null;
    }
    table.id = tableId;

    container.innerHTML = "";
    while (holder.firstChild) container.appendChild(holder.firstChild);

    return table;
  }

  function updateSliderUI(slider, fillEl, valEl) {
    if (!slider) return;
    var v = Number(slider.value || 1);
    if (valEl) valEl.textContent = String(v);

    if (fillEl) {
      var min = Number(slider.min || 1);
      var max = Number(slider.max || 12);
      var pct = max === min ? 0 : ((v - min) / (max - min)) * 100;
      fillEl.style.width = pct + "%";
    }
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // ============================
  // SVG icons (small)
  // ============================
  function gearSvg() {
    return `
      <svg viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33A1.65 1.65 0 0 0 14 21v.09a2 2 0 0 1-4 0V21a1.65 1.65 0 0 0-1.11-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15 1.65 1.65 0 0 0 3 13.4V13a2 2 0 0 1 0-2v-.4A1.65 1.65 0 0 0 4.6 9 1.65 1.65 0 0 0 4.93 7.18l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6 1.65 1.65 0 0 0 10.6 3H11a2 2 0 0 1 2 0h.4A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9 1.65 1.65 0 0 0 21 10.6V11a2 2 0 0 1 0 2v.4A1.65 1.65 0 0 0 19.4 15z"></path>
      </svg>`;
  }
  function xSvg() {
    return `<svg viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12"></path></svg>`;
  }
  function checkSvg() {
    return `<svg viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7"></path></svg>`;
  }
  function upSvg() {
    return `<svg viewBox="0 0 24 24" fill="none"><path d="M12 5l-7 7h4v7h6v-7h4l-7-7z"></path></svg>`;
  }
  function downSvg() {
    return `<svg viewBox="0 0 24 24" fill="none"><path d="M12 19l7-7h-4V5H9v7H5l7 7z"></path></svg>`;
  }

  function intakeSvg() {
    return `
      <svg viewBox="0 0 24 24" fill="none">
        <g transform="translate(0,3)">
          <circle class="pill-clock-circle" cx="9" cy="9" r="5.25"></circle>
          <path class="pill-clock-hands" d="M9 6.5v3l2 1.5"></path>
          <rect class="pill-clock-pill" x="12.5" y="11" width="7" height="4" rx="2"></rect>
          <path class="pill-clock-pill" d="M13 11.5l5 3"></path>
        </g>
      </svg>`;
  }

  // ============================
  // Render
  // ============================

  function renderAll() {
    var list = document.getElementById("personal-list");
    if (!list) return;

    var items = loadAll();
    list.innerHTML = "";

    for (var i = 0; i < items.length; i++) {
      renderOne(list, items[i]);
    }
  }

  function renderOne(listEl, item) {
    var id = item.id;
    var prefix = "per-" + id;

    var block = document.createElement("div");
    block.className = "config-block personal-block";
    block.id = prefix + "-block";

    // универсална картинка (може да я сменим по-късно)
    var imgSrc = "assets/products/additional/ber-custom.webp";

    block.innerHTML = `
      <div class="prog-head">
        <div class="prog-head-main clickable" id="${prefix}-head">
          <img class="prod-img" id="${prefix}-img" src="${imgSrc}" alt="Личен продукт"/>
          <div class="prog-cap-stack">
            <div class="prog-cap-row">
              <span class="prog-cap-main" id="${prefix}-cap-main">${escapeHtml(item.title || "Нов продукт")}</span>
              <button id="${prefix}-settings-btn" class="prog-cap-settings" type="button" title="Настройки">
                ${gearSvg()}
              </button>
            </div>
            <span class="prog-cap-brand" id="${prefix}-cap-brand">${escapeHtml(item.title || "")}</span>
          </div>
        </div>

        <div class="prog-head-actions">
          <button id="${prefix}-intake" class="clk-btn intake prog-intake-btn" type="button" title="Прием" style="display:none">
            <span class="clk-btn-icon">${intakeSvg()}</span>
          </button>
        </div>
      </div>

      <div class="prog-config" id="${prefix}-config" style="display:none;">
        <div class="field">
          <div class="lbl">Заглавие:</div>
          <input type="text" id="${prefix}-title" placeholder="Напр. Магнезий / D3+K2 / Метформин" value="${escapeHtml(item.title || "")}">
        </div>

        <div class="field">
          <div class="lbl">
            Прием дневно:
            <strong class="slider-val" id="${prefix}-slider-val">${Number(item.rows || 1)}</strong>
          </div>
          <div class="slider-track-wrapper">
            <div class="slider-track-fill" id="${prefix}-slider-track-fill"></div>
            <input type="range" id="${prefix}-slider" min="1" max="12" value="${Number(item.rows || 1)}" class="slider-control">
          </div>
        </div>

        <div class="config-actions">
          <span class="lbl"></span>
          <div class="config-buttons">
            <button id="${prefix}-save" class="clk-btn primary" type="button" title="Запази">
              <span class="clk-btn-icon">${checkSvg()}</span>
            </button>
            <button id="${prefix}-delete" class="clk-btn danger" type="button" title="Изтрий">
              <span class="clk-btn-icon">${xSvg()}</span>
            </button>

            <div class="personal-move">
              <button id="${prefix}-up" class="clk-btn secondary" type="button" title="Нагоре">
                <span class="clk-btn-icon">${upSvg()}</span>
              </button>
              <button id="${prefix}-down" class="clk-btn secondary" type="button" title="Надолу">
                <span class="clk-btn-icon">${downSvg()}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="pl-wrap" id="${prefix}-grid" style="display:none;"></div>
    `;

    listEl.appendChild(block);

    // Hook
    var head = document.getElementById(prefix + "-head");
    var settingsBtn = document.getElementById(prefix + "-settings-btn");
    var config = document.getElementById(prefix + "-config");
    var titleInput = document.getElementById(prefix + "-title");
    var slider = document.getElementById(prefix + "-slider");
    var sliderVal = document.getElementById(prefix + "-slider-val");
    var sliderFill = document.getElementById(prefix + "-slider-track-fill");
    var capMain = document.getElementById(prefix + "-cap-main");
    var capBrand = document.getElementById(prefix + "-cap-brand");
    var gridWrap = document.getElementById(prefix + "-grid");
    var intakeBtn = document.getElementById(prefix + "-intake");
    var btnSave = document.getElementById(prefix + "-save");
    var btnDel = document.getElementById(prefix + "-delete");
    var btnUp = document.getElementById(prefix + "-up");
    var btnDown = document.getElementById(prefix + "-down");

    // Local instance for grid (not persisted)
    item._gridInstance = item._gridInstance || null;

    function isConfigured(it) {
      return it && Number(it.rows || 0) > 0 && Array.isArray(it.times) && it.times.length === Number(it.rows || 0);
    }

    function updateHeader(it) {
      var t = (it.title || "").trim();
      capMain.textContent = t || "Нов продукт";
      capBrand.textContent = t || "";
      if (isConfigured(it)) capMain.classList.add("configured");
      else capMain.classList.remove("configured");
    }

    function ensureGrid(it) {
      var cfg = isConfigured(it);
      gridWrap.style.display = cfg ? "block" : "none";
      intakeBtn.style.display = cfg ? "flex" : "none";

      if (!cfg) {
        gridWrap.innerHTML = "";
        if (it._gridInstance && typeof it._gridInstance.destroy === "function") {
          it._gridInstance.destroy();
        }
        it._gridInstance = null;
        return;
      }

      var tableId = prefix + "-table";
      cloneTemplateGridInto(gridWrap, tableId);

      var table = document.getElementById(tableId);
      if (!table) return;
      var tbody = table.querySelector("tbody");
      if (!tbody) return;
      tbody.innerHTML = "";

      var rows = Number(it.rows || 1);

      if (!Array.isArray(it.times) || it.times.length !== rows) {
        it.times = buildDefaultTimes(rows);
      }

      // Build rows x 7
      for (var r = 0; r < rows; r++) {
        var tr = document.createElement("tr");
        for (var c = 0; c < 7; c++) {
          var td = document.createElement("td");
          td.className = "pl-time-cell";
          td.setAttribute("data-row", String(r));
          td.setAttribute("data-dow", String(c === 6 ? 0 : (c + 1)));
          td.textContent = it.times[r][c] || PERSONAL_DEFAULT_TIME;
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      }

      try {
        var grid = createProductGrid({
          tableId: tableId,
          intakeBtnId: prefix + "-intake",
          productName: (it.title || "Личен продукт"),
          blockId: prefix + "-block"
        });

        if (!window.grids) window.grids = [];
        window.grids.push(grid);

        it._gridInstance = grid;
      } catch (e) {
        console.error("createProductGrid error", e);
      }
    }

    function openConfig(open) {
      var show = (typeof open === "boolean") ? open : (config.style.display !== "block");
      config.style.display = show ? "block" : "none";
      settingsBtn.innerHTML = show ? xSvg() : gearSvg();
    }

    // Head click -> open config (as requested)
    head.addEventListener("click", function () { openConfig(true); });
    settingsBtn.addEventListener("click", function (e) { e.stopPropagation(); openConfig(); });

    // Slider UI
    updateSliderUI(slider, sliderFill, sliderVal);
    slider.addEventListener("input", function () { updateSliderUI(slider, sliderFill, sliderVal); });

    // Save
    btnSave.addEventListener("click", function () {
      var items = loadAll();
      var idx = findIndexById(items, id);
      if (idx < 0) return;

      var t = (titleInput.value || "").trim();
      if (!t) {
        alert("Моля, въведи заглавие на продукта.");
        return;
      }

      var rows = Number(slider.value || 1);

      items[idx].title = t;
      items[idx].rows = rows;

      if (!Array.isArray(items[idx].times) || items[idx].times.length !== rows) {
        items[idx].times = buildDefaultTimes(rows);
      }

      saveAll(items);

      // update current item
      item.title = t;
      item.rows = rows;
      item.times = items[idx].times;

      updateHeader(item);
      ensureGrid(item);
      openConfig(false);
    });

    // Delete
    btnDel.addEventListener("click", function () {
      if (!confirm("Да изтрия ли този продукт от Личен режим?")) return;
      var items = loadAll();
      var idx = findIndexById(items, id);
      if (idx < 0) return;

      items.splice(idx, 1);
      saveAll(items);
      renderAll();
    });

    // Move up/down
    btnUp.addEventListener("click", function () {
      var items = loadAll();
      var idx = findIndexById(items, id);
      if (idx <= 0) return;

      var tmp = items[idx - 1];
      items[idx - 1] = items[idx];
      items[idx] = tmp;

      saveAll(items);
      renderAll();

      setTimeout(function () {
        var cfg = document.getElementById(prefix + "-config");
        var sb = document.getElementById(prefix + "-settings-btn");
        if (cfg) cfg.style.display = "block";
        if (sb) sb.innerHTML = xSvg();
      }, 0);
    });

    btnDown.addEventListener("click", function () {
      var items = loadAll();
      var idx = findIndexById(items, id);
      if (idx < 0 || idx >= items.length - 1) return;

      var tmp = items[idx + 1];
      items[idx + 1] = items[idx];
      items[idx] = tmp;

      saveAll(items);
      renderAll();

      setTimeout(function () {
        var cfg = document.getElementById(prefix + "-config");
        var sb = document.getElementById(prefix + "-settings-btn");
        if (cfg) cfg.style.display = "block";
        if (sb) sb.innerHTML = xSvg();
      }, 0);
    });

    // initial state
    updateHeader(item);
    ensureGrid(item);
  }

  // ============================
  // Init
  // ============================
  function init() {
    var addBtn = document.getElementById("personal-add");
    var list = document.getElementById("personal-list");
    if (!addBtn || !list) return;

    renderAll();

    addBtn.addEventListener("click", function () {
      var items = loadAll();
      var newItem = {
        id: uid(),
        title: "",
        rows: 1,
        times: buildDefaultTimes(1),
        createdAt: nowTs()
      };

      items.push(newItem);
      saveAll(items);

      renderAll();

      // open config immediately
      setTimeout(function () {
        var prefix = "per-" + newItem.id;
        var cfg = document.getElementById(prefix + "-config");
        var sb = document.getElementById(prefix + "-settings-btn");
        var title = document.getElementById(prefix + "-title");

        if (cfg) cfg.style.display = "block";
        if (sb) sb.innerHTML = xSvg();
        if (title) title.focus();
      }, 0);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

})();