/*
 * PROGRAM GRID
 * Генериране на решетката, обработка на статуси (upcoming, done).
 */

window.APP = window.APP || {};

APP.grid = {
  // Конфигурация за деня от седмицата (0-6, Неделя-Събота)
  // В JS 0=Неделя, 1=Понеделник. В HTML data-dow: 1=Пн ... 0=Нд
  
  initTable: function(tableId, timesMatrix, onTimeChange) {
    const table = APP.dom.get(tableId);
    if (!table) return;

    const tbody = table.querySelector('tbody');
    tbody.innerHTML = ''; // Изчистване

    timesMatrix.forEach((rowTimes, rowIdx) => {
      const tr = document.createElement('tr');
      
      // За всеки ден от седмицата (1..6, 0) - общо 7 колони
      // Редът на колоните е: Пн(1), Вт(2), Ср(3), Чт(4), Пт(5), Сб(6), Нд(0)
      const daysOrder = [1, 2, 3, 4, 5, 6, 0];
      
      daysOrder.forEach(dow => {
        const td = document.createElement('td');
        td.className = 'pl-time-cell';
        td.dataset.row = rowIdx;
        td.dataset.dow = dow;
        
        // Времето за този ден от матрицата
        // Ако матрицата е проста [ ["08:00", ...], ["19:00", ...] ]
        // Тук приемаме, че rowTimes е просто един стринг "08:00", който важи за всички дни
        // ИЛИ rowTimes е масив от 7 стринга.
        let timeStr = "";
        if (Array.isArray(rowTimes)) {
            // Mapping dow to index? Needs logic. 
            // За простота: приемаме, че timeStr се подава като базова стойност, 
            // а реалната стойност се чете от потребителските настройки (ако има)
            // Но за 'init' просто слагаме дефолта.
            timeStr = rowTimes[0]; // Placeholder
        } else {
            timeStr = rowTimes;
        }

        td.textContent = timeStr;
        
        // Клик за редакция
        td.addEventListener('click', () => {
          APP.clock.open(td.textContent, 'Настройка на прием', getDayName(dow), (newTime, mode) => {
            if (mode === 'single') {
              td.textContent = newTime;
              // Save logic here needed
              onTimeChange(rowIdx, dow, newTime, 'single');
            } else {
              // Update whole row
              const cells = tr.querySelectorAll('td');
              cells.forEach(c => c.textContent = newTime);
              onTimeChange(rowIdx, dow, newTime, 'all');
            }
            this.updateStatuses(tableId);
          });
        });

        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    
    this.highlightToday(tableId);
    this.updateStatuses(tableId);
  },

  highlightToday: function(tableId) {
    const table = APP.dom.get(tableId);
    if (!table) return;
    
    const today = new Date().getDay(); // 0-6
    // Намиране на хедъра за днешния ден
    const th = table.querySelector(`th.pl-day[data-dow="${today}"]`);
    if (th) th.classList.add('today');
    
    // Намиране на колоната в тялото (CSS се грижи за border-а, но може и тук)
  },

  updateStatuses: function(tableId) {
    // Проверка на текущото време спрямо клетките
    const table = APP.dom.get(tableId);
    if (!table) return;
    
    const now = new Date();
    const currentDow = now.getDay();
    const currentH = now.getHours();
    const currentM = now.getMinutes();
    const currentTotalM = currentH * 60 + currentM;

    const cells = table.querySelectorAll('td.pl-time-cell');
    
    cells.forEach(td => {
      td.classList.remove('int-done', 'int-upcoming', 'int-overdue');
      
      const cellDow = parseInt(td.dataset.dow);
      
      // Логика само за днешния ден (примерна)
      if (cellDow === currentDow) {
        const [h, m] = td.textContent.split(':').map(Number);
        const cellTotalM = h * 60 + m;
        
        // Ако часът е минал
        if (currentTotalM > cellTotalM + 15) { // 15 мин толеранс
           // Тук трябва да проверим дали потребителят го е маркирал като "Done"
           // Засега просто логика: ако е минало -> overdue (ако не е чекнато)
           td.classList.add('int-overdue');
        } else if (currentTotalM >= cellTotalM - 30 && currentTotalM <= cellTotalM + 15) {
           td.classList.add('int-upcoming');
        }
      }
    });
  }
};

function getDayName(dow) {
  const days = ['Неделя', 'Понеделник', 'Вторник', 'Сряда', 'Четвъртък', 'Петък', 'Събота'];
  return days[dow];
}