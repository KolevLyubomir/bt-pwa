/* DATA.JS (Module Version) */
import { todayISO } from './utils.js';

export function initData() {
  console.log("🔹 Data module initialized");

  // --- Helpers ---
  function isoToBG_YY(iso) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return "";
    var y = iso.slice(0, 4), m = iso.slice(5, 7), d = iso.slice(8, 10);
    return d + "." + m + "." + y.slice(2);
  }

  function bgToISO_any(bg) {
    var m2 = bg.match(/^(\d{2})\.(\d{2})\.(\d{2})$/);
    if (m2) return "20" + m2[3] + "-" + m2[2] + "-" + m2[1];
    var m4 = bg.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (m4) return m4[3] + "-" + m4[2] + "-" + m4[1];
    return "";
  }

  // --- Storage ---
  var KEY = "bt-progress";
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } 
    catch (_) { return []; }
  }
  function save(a) { localStorage.setItem(KEY, JSON.stringify(a)); }
  function sortDesc(a) { return a.slice().sort((x, y) => y.date.localeCompare(x.date)); }
  function sortAsc(a) { return a.slice().sort((x, y) => x.date.localeCompare(y.date)); }

  // --- DOM Elements ---
  var dateText = document.getElementById("dateText"),
      calEl = document.getElementById("cal"),
      weight = document.getElementById("weight"),
      addBtn = document.getElementById("addBtn"),
      btFlag = document.getElementById("btFlag"),
      exportBtn = document.getElementById("exportBtn"),
      importBtn = document.getElementById("importBtn"),
      importFile = document.getElementById("importFile"),
      tbody = document.querySelector("#tbl tbody"),
      // tfoot = document.querySelector("#tfootBottom"), // Може да се ползва и долу
      pageSizeEl = document.getElementById("pageSize"),
      pagerTop = document.getElementById("pagerTop"),
      pagerBottom = document.getElementById("pagerBottom"),
      aggSel = document.getElementById("aggSel"),
      ctx = document.getElementById("chart");

  var state = { page: 0, pageSize: 28 };

  // --- Chart Logic ---
  function renderChart() {
    if (!ctx) return;
    var arr = sortAsc(load());
    var W = ctx.parentElement.clientWidth;
    var H = 360;
    
    // Canvas dimensions setup
    ctx.width = W; 
    ctx.height = H;
    
    var cx = ctx.getContext("2d");
    cx.clearRect(0, 0, W, H);

    if (arr.length < 2) {
      cx.font = "14px sans-serif";
      cx.fillStyle = "#9fb4ad";
      cx.textAlign = "center";
      cx.fillText("Няма достатъчно данни за графика", W / 2, H / 2);
      return;
    }

    // Aggregation
    var agg = aggSel ? aggSel.value : "daily";
    var dataPoints = [];

    if (agg === "daily") {
      dataPoints = arr.map(x => ({ l: isoToBG_YY(x.date), v: x.weight }));
    } else if (agg === "weekly") {
      var tmp = {};
      arr.forEach(x => {
        var d = new Date(x.date), y = d.getFullYear(), w = getWeekNumber(d);
        var k = y + "-W" + w;
        if (!tmp[k]) tmp[k] = { sum: 0, cnt: 0, lastDate: x.date };
        tmp[k].sum += x.weight;
        tmp[k].cnt++;
        if (x.date > tmp[k].lastDate) tmp[k].lastDate = x.date;
      });
      dataPoints = Object.keys(tmp).sort().map(k => ({
        l: isoToBG_YY(tmp[k].lastDate),
        v: tmp[k].sum / tmp[k].cnt
      }));
    } else {
      // monthly
      var tmp = {};
      arr.forEach(x => {
        var k = x.date.slice(0, 7);
        if (!tmp[k]) tmp[k] = { sum: 0, cnt: 0 };
        tmp[k].sum += x.weight;
        tmp[k].cnt++;
      });
      dataPoints = Object.keys(tmp).sort().map(k => ({
        l: k.slice(5),
        v: tmp[k].sum / tmp[k].cnt
      }));
    }

    // Limit points
    if (dataPoints.length > 30) dataPoints = dataPoints.slice(dataPoints.length - 30);

    // Scaling
    var maxV = -Infinity, minV = Infinity;
    dataPoints.forEach(p => {
      if (p.v > maxV) maxV = p.v;
      if (p.v < minV) minV = p.v;
    });
    var rng = maxV - minV;
    if (rng === 0) rng = 1;
    var pad = rng * 0.1;
    maxV += pad;
    minV -= pad;

    var padL = 40, padR = 10, padT = 20, padB = 30;
    var drawW = W - padL - padR, drawH = H - padT - padB;

    // Draw Grid & Y-Axis Labels
    cx.beginPath();
    cx.strokeStyle = "#1e2b30";
    cx.lineWidth = 1;
    for (var i = 0; i <= 5; i++) {
      var y = padT + (drawH / 5) * i;
      cx.moveTo(padL, y);
      cx.lineTo(W - padR, y);
      
      var val = maxV - (i * (maxV - minV) / 5);
      cx.fillStyle = "#9fb4ad";
      cx.font = "12px sans-serif";
      cx.textAlign = "right";
      cx.fillText(val.toFixed(1), padL - 6, y + 4);
    }
    cx.stroke();

    // Draw Line
    cx.beginPath();
    cx.strokeStyle = "#10b981";
    cx.lineWidth = 3;
    cx.lineJoin = "round";
    var step = drawW / (dataPoints.length - 1 || 1);
    var points = [];
    
    dataPoints.forEach((p, i) => {
      var x = padL + i * step;
      var y = padT + drawH - ((p.v - minV) / (maxV - minV)) * drawH;
      points.push({ x: x, y: y, lbl: p.l, val: p.v });
      if (i === 0) cx.moveTo(x, y);
      else cx.lineTo(x, y);
    });
    cx.stroke();

    // Draw Points & X-Axis Labels
    points.forEach(p => {
      cx.beginPath();
      cx.fillStyle = "#0b1215";
      cx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      cx.fill();
      
      cx.beginPath();
      cx.strokeStyle = "#10b981";
      cx.lineWidth = 2;
      cx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      cx.stroke();

      cx.fillStyle = "#9fb4ad";
      cx.font = "11px sans-serif";
      cx.textAlign = "center";
      cx.fillText(p.lbl, p.x, H - 10);
    });
  }

  function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  }

  // --- Table Logic ---
  function renderTable() {
    if (!tbody) return;
    var all = sortDesc(load());
    var pSizeVal = (pageSizeEl && pageSizeEl.value) ? pageSizeEl.value : "28";
    state.pageSize = pSizeVal;
    
    var pSize = state.pageSize === "all" ? all.length : parseInt(state.pageSize, 10);
    var total = all.length;
    var totalPages = Math.ceil(total / pSize) || 1;
    
    if (state.page >= totalPages) state.page = totalPages - 1;
    if (state.page < 0) state.page = 0;

    var start = state.page * pSize;
    var end = start + pSize;
    var sliced = all.slice(start, end);

    tbody.innerHTML = "";
    sliced.forEach((r) => {
      var tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="date">${isoToBG_YY(r.date)}</td>
        <td class="w">
          <span style="color:${r.bt ? "#10b981" : "#e6f2ef"}; font-weight:${r.bt ? "700" : "400"}">
            ${r.weight}
          </span>
        </td>
        <td class="actions">
          <button class="icon del-btn" data-date="${r.date}" title="Изтрий">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
            </svg>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    renderPager(totalPages);

    // Attach delete handlers
    tbody.querySelectorAll(".del-btn").forEach(b => {
      b.addEventListener("click", function () {
        if (confirm("Сигурен ли си?")) {
          var d = this.getAttribute("data-date");
          var arr = load().filter(x => x.date !== d);
          save(arr);
          renderTable();
          renderChart();
        }
      });
    });
  }

  function renderPager(pages) {
    var html = "";
    for (var i = 0; i < pages; i++) {
      html += `<button class="${i === state.page ? 'active' : ''}" data-p="${i}">${i + 1}</button>`;
    }
    if(pagerTop) pagerTop.innerHTML = html;
    if(pagerBottom) pagerBottom.innerHTML = html;

    [pagerTop, pagerBottom].forEach(el => {
      if(!el) return;
      el.querySelectorAll("button").forEach(b => {
        b.addEventListener("click", () => {
          state.page = parseInt(b.getAttribute("data-p"), 10);
          renderTable();
        });
      });
    });
  }

  // --- Calendar Logic (Simple) ---
  function renderCal() {
    // Вмъкваме опростена версия, която само позволява избор на днешна дата и предишни
    if(!calEl) return;
    
    // За да не усложняваме с пълен календар код тук, правим базова структура
    // Ако искаш пълния календар от старата версия, ще трябва да го пренесем целия.
    // Засега: Просто показваме текущия месец
    var now = new Date();
    var y = now.getFullYear(), m = now.getMonth();
    var daysInMonth = new Date(y, m+1, 0).getDate();
    
    var html = `<div class="cal-head"><span class="cal-title">${y}-${m+1}</span></div><div class="cal-grid" style="display:grid; grid-template-columns:repeat(7,1fr); gap:2px;">`;
    
    for(var i=1; i<=daysInMonth; i++) {
        var iso = y + "-" + String(m+1).padStart(2,'0') + "-" + String(i).padStart(2,'0');
        html += `<button class="cal-day-btn" data-date="${iso}" style="padding:6px; background:#0b1215; border:1px solid #20343a; color:#fff; border-radius:4px;">${i}</button>`;
    }
    html += `</div>`;
    calEl.innerHTML = html;
    
    calEl.querySelectorAll('.cal-day-btn').forEach(b => {
        b.addEventListener('click', function(e){
            e.stopPropagation();
            if(dateText) dateText.value = isoToBG_YY(this.dataset.date);
            calEl.classList.remove("show");
        });
    });
  }

  // --- Event Listeners ---
  if (aggSel) aggSel.addEventListener("change", renderChart);
  
  if (pageSizeEl) {
    pageSizeEl.addEventListener("change", function () {
      state.pageSize = this.value;
      state.page = 0;
      renderTable();
    });
  }

  if (dateText) {
    dateText.value = isoToBG_YY(todayISO());
    dateText.addEventListener("click", function (e) {
      e.stopPropagation();
      if(calEl) {
          calEl.classList.toggle("show");
          if (calEl.classList.contains("show")) renderCal();
      }
    });
  }

  // Close calendar on outside click
  document.addEventListener("click", function (e) {
    if (calEl && !calEl.contains(e.target) && e.target !== dateText) {
      calEl.classList.remove("show");
    }
  });

  if (addBtn) {
    addBtn.addEventListener("click", function () {
      var wStr = weight.value;
      var w = parseFloat(wStr);
      if (!w || w <= 0 || w > 300) {
        alert("Моля въведи валидно тегло.");
        return;
      }

      var dIso = bgToISO_any(dateText.value) || todayISO();
      var isBt = btFlag ? btFlag.checked : false;

      var arr = load();
      arr = arr.filter(x => x.date !== dIso); // Overwrite same day
      arr.push({ date: dIso, weight: w, bt: isBt });
      save(arr);

      renderTable();
      renderChart();
      weight.value = "";
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener("click", function () {
      var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(load(), null, 2));
      var a = document.createElement('a');
      a.href = dataStr;
      a.setAttribute("download", "bt-progress-export.json");
      document.body.appendChild(a);
      a.click();
      a.remove();
    });
  }

  if (importBtn && importFile) {
    importBtn.addEventListener("click", () => importFile.click());
    importFile.addEventListener("change", () => {
      var f = importFile.files[0];
      if (!f) return;
      var fr = new FileReader();
      fr.onload = () => {
        try {
          var arr = JSON.parse(fr.result || "[]");
          if (!Array.isArray(arr)) throw new Error("Невалиден формат");
          save(arr);
          renderTable();
          renderChart();
          alert("Импортът е успешен.");
        } catch (e) {
          alert("Грешка: " + e.message);
        }
        importFile.value = "";
      };
      fr.readAsText(f);
    });
  }

  // Initial Render
  renderTable();
  renderChart();
}