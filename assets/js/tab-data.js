/*
 * TAB DATA
 * Логика за въвеждане на тегло, календар, таблица с история и графика.
 */

window.APP = window.APP || {};

APP.data = {
  records: [],
  chartInstance: null,

  init: function() {
    this.loadData();
    this.bindEvents();
    this.renderTable();
    // Графиката се рендира при смяна на таба или добавяне на запис
  },

  loadData: function() {
    const raw = localStorage.getItem(APP.config.storageKeyData);
    if (raw) {
      try {
        this.records = JSON.parse(raw);
        // Сортиране по дата (низходящ ред - най-новите първи)
        this.records.sort((a, b) => new Date(b.date) - new Date(a.date));
      } catch (e) {
        console.error("Error loading data", e);
        this.records = [];
      }
    }
  },

  saveData: function() {
    localStorage.setItem(APP.config.storageKeyData, JSON.stringify(this.records));
    this.renderTable();
    this.renderChart();
  },

  bindEvents: function() {
    // Бутон Добави
    APP.dom.listen(APP.dom.get('addBtn'), 'click', () => this.addRecord());
    
    // Input за тегло - Enter key
    APP.dom.listen(APP.dom.get('weight'), 'keydown', (e) => {
      if (e.key === 'Enter') this.addRecord();
    });

    // Експорт / Импорт
    APP.dom.listen(APP.dom.get('exportBtn'), 'click', () => this.exportJSON());
    APP.dom.listen(APP.dom.get('importBtn'), 'click', () => APP.dom.get('importFile').click());
    APP.dom.listen(APP.dom.get('importFile'), 'change', (e) => this.importJSON(e));
    
    // Агрегация на графиката
    APP.dom.listen(APP.dom.get('aggSel'), 'change', () => this.renderChart());
    
    // Пейджинг (размер на страница)
    APP.dom.listen(APP.dom.get('pageSize'), 'change', () => this.renderTable());
    
    // Инициализация на днешна дата в полето
    this.setTodayDate();
  },

  setTodayDate: function() {
    const today = new Date();
    const d = String(today.getDate()).padStart(2, '0');
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const y = today.getFullYear();
    const field = APP.dom.get('dateText');
    if (field) field.value = `${d}.${m}.${y}`;
  },

  addRecord: function() {
    const wInput = APP.dom.get('weight');
    const dInput = APP.dom.get('dateText'); // Предполагаме формат ДД.ММ.ГГГГ
    const btCheck = APP.dom.get('btFlag');

    const weightVal = parseFloat(wInput.value);
    if (!weightVal || weightVal <= 0) {
      alert('Моля въведете валидно тегло.');
      return;
    }

    // Парсване на датата от текста
    const parts = dInput.value.split('.');
    if (parts.length !== 3) return;
    // Date object очаква YYYY-MM-DD или аргументи (y, m-1, d)
    const isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`; 

    const newRec = {
      id: Date.now().toString(),
      date: isoDate,
      weight: weightVal,
      isBt: btCheck.checked
    };

    // Проверка дали вече има запис за тази дата - ако да, обновяваме го
    const existingIdx = this.records.findIndex(r => r.date === isoDate);
    if (existingIdx >= 0) {
      if(!confirm('Вече има запис за тази дата. Да го презапиша ли?')) return;
      this.records[existingIdx] = newRec;
    } else {
      this.records.push(newRec);
    }

    // Сортиране
    this.records.sort((a, b) => new Date(b.date) - new Date(a.date));

    this.saveData();
    wInput.value = ''; // Изчистване
  },

  deleteRecord: function(id) {
    if(!confirm('Сигурни ли сте, че искате да изтриете този запис?')) return;
    this.records = this.records.filter(r => r.id !== id);
    this.saveData();
  },

  renderTable: function() {
    const tbody = document.querySelector('#tbl tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const pageSizeVal = APP.dom.get('pageSize').value;
    const limit = pageSizeVal === 'all' ? this.records.length : parseInt(pageSizeVal);
    
    // Взимаме само първите N записа (за по-просто тук няма пълна пагинация с бутони 1,2,3)
    const visibleRecs = this.records.slice(0, limit);

    visibleRecs.forEach(rec => {
      const row = document.createElement('tr');
      const d = new Date(rec.date);
      const dateStr = d.toLocaleDateString('bg-BG');
      
      row.innerHTML = `
        <td class="date">${dateStr} ${rec.isBt ? '<span style="color:#22c55e">●</span>' : ''}</td>
        <td class="w"><strong>${rec.weight}</strong></td>
        <td class="actions">
          <button class="del-btn" title="Изтрий" data-id="${rec.id}">✕</button>
        </td>
      `;
      tbody.appendChild(row);
    });

    // Event delegation за бутоните за триене
    tbody.querySelectorAll('.del-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.deleteRecord(e.target.dataset.id);
      });
    });
    
    // Обновяване на инфото за странициране
    const info = APP.dom.get('pagerTop');
    if(info) info.textContent = `Показани ${visibleRecs.length} от ${this.records.length}`;
  },

  renderChart: function() {
    const ctx = APP.dom.get('chart');
    if (!ctx) return;
    
    // Ако няма данни
    if (this.records.length === 0) return;

    // Подготовка на данните (обръщаме масива, за да е хронологичен за графиката)
    // Копираме, за да не объркаме основния масив
    let chartData = [...this.records].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Агрегация (примерна проста логика)
    // ... тук може да се добави логика за седмично/месечно усредняване
    // Засега показваме всичко
    
    const labels = chartData.map(r => {
      const d = new Date(r.date);
      return `${d.getDate()}.${d.getMonth()+1}`;
    });
    const dataPoints = chartData.map(r => r.weight);

    // Унищожаване на стара инстанция ако има
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    // Chart.js (предполагаме че е зареден глобално)
    if (typeof Chart !== 'undefined') {
      this.chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Тегло (kg)',
            data: dataPoints,
            borderColor: '#22c55e',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            tension: 0.3,
            fill: true
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: { beginAtZero: false, grid: { color: '#20343a' } },
            x: { grid: { display: false } }
          }
        }
      });
    }
  },

  exportJSON: function() {
    const dataStr = JSON.stringify(this.records, null, 2);
    const blob = new Blob([dataStr], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bt-data-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  },

  importJSON: function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target.result);
        if (Array.isArray(json)) {
          // Обединяване (може и заместване)
          if(confirm('Да заменя ли текущите данни с новите? (Cancel ще ги добави)')) {
            this.records = json;
          } else {
             // Добавяне само на уникални по ID или дата
             json.forEach(newItem => {
               if(!this.records.find(r => r.date === newItem.date)) {
                 this.records.push(newItem);
               }
             });
          }
          this.saveData();
          alert('Импортът е успешен!');
        }
      } catch (err) {
        alert('Грешка при четене на файла.');
      }
    };
    reader.readAsText(file);
  }
};