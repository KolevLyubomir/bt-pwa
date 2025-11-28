/*
 * UI CLOCK
 * Логика за аналоговия часовник (Picker) и модалния прозорец.
 */

window.APP = window.APP || {};

APP.clock = {
  active: false,
  currentTime: { h: 0, m: 0 },
  callback: null,
  view: 'hours', // 'hours' | 'mins'
  
  els: {}, // DOM референции

  init: function() {
    // Кеширане на елементи
    this.els = {
      modal: APP.dom.get('clk'),
      card: APP.dom.get('clkCard'),
      face: APP.dom.get('clkFace'),
      ringH: APP.dom.get('ringH'),
      ringM: APP.dom.get('ringM'),
      handH: APP.dom.get('handH'),
      handM: APP.dom.get('handM'),
      
      readH: APP.dom.get('clkH'),
      readM: APP.dom.get('clkM'),
      
      title: APP.dom.get('clk-product'),
      day: APP.dom.get('clk-weekday'),
      
      btnSaveOne: APP.dom.get('btnSaveOne'),
      btnSaveAll: APP.dom.get('btnSaveAllDays'),
      btnAudio: APP.dom.get('btnAudio'),
      btnIntake: APP.dom.get('btnIntake')
    };

    this.renderTicks();
    this.bindEvents();
  },

  open: function(initialTimeStr, title, dayInfo, onSave) {
    this.active = true;
    this.callback = onSave;
    
    // Parse time "HH:MM"
    const [h, m] = initialTimeStr.split(':').map(Number);
    this.currentTime = { h: h || 0, m: m || 0 };
    
    // UI Setup
    this.els.title.textContent = title || 'Настройка на час';
    this.els.day.textContent = dayInfo || '';
    
    this.els.modal.classList.add('show');
    this.setView('hours'); // Винаги започваме от часовете
    this.updateClockHands();
    this.updateReadout();
  },

  close: function() {
    this.active = false;
    this.els.modal.classList.remove('show');
    this.callback = null;
  },

  bindEvents: function() {
    // Затваряне при клик извън картата
    APP.dom.listen(this.els.modal, 'click', (e) => {
      if (e.target === this.els.modal) this.close();
    });

    // Смяна на view при клик върху цифрите горе
    APP.dom.listen(this.els.readH, 'click', () => this.setView('hours'));
    APP.dom.listen(this.els.readM, 'click', () => this.setView('mins'));

    // Интеракция с часовника (touch/mouse)
    const handleInput = (e) => this.processInput(e);
    
    ['mousedown', 'touchstart'].forEach(evt => 
      APP.dom.listen(this.els.face, evt, (e) => {
        this.isDragging = true;
        handleInput(e);
        e.preventDefault(); // Prevent scroll on touch
      })
    );
    
    ['mousemove', 'touchmove'].forEach(evt => 
      APP.dom.listen(document, evt, (e) => {
        if (this.isDragging) {
          handleInput(e);
        }
      })
    );
    
    ['mouseup', 'touchend'].forEach(evt => 
      APP.dom.listen(document, evt, () => {
        if (this.isDragging) {
          this.isDragging = false;
          // Ако сме пуснали мишката и сме били на часове, минаваме към минути за удобство
          if (this.view === 'hours') {
             setTimeout(() => this.setView('mins'), 300);
          }
        }
      })
    );

    // Бутони за запис
    APP.dom.listen(this.els.btnSaveOne, 'click', () => {
      this.triggerSave('single');
    });
    
    APP.dom.listen(this.els.btnSaveAll, 'click', () => {
      this.triggerSave('all');
    });
  },

  setView: function(view) {
    this.view = view;
    // Визуална промяна (кой ринг се вижда)
    // В CSS може да се контролира с display:none или opacity
    // Тук за простота:
    this.els.ringH.style.display = view === 'hours' ? 'block' : 'none';
    this.els.ringM.style.display = view === 'mins' ? 'block' : 'none';
    
    this.els.handH.style.opacity = view === 'hours' ? 1 : 0.3;
    this.els.handM.style.opacity = view === 'mins' ? 1 : 0.3;
    
    // Highlight активната част в readout-а
    this.els.readH.style.color = view === 'hours' ? '#22c55e' : '#e6f2ef';
    this.els.readM.style.color = view === 'mins' ? '#22c55e' : '#e6f2ef';
  },

  processInput: function(e) {
    const rect = this.els.face.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const x = clientX - rect.left - centerX;
    const y = clientY - rect.top - centerY;
    
    // Изчисляване на ъгъл
    let deg = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (deg < 0) deg += 360;
    
    // Нормализиране и snap към стойности
    if (this.view === 'hours') {
      let h = Math.round(deg / 30);
      if (h === 0) h = 12; // 0 градуса (горе) е 12
      // За 24 часови формати е по-сложно, но тук правим прост 12/24 logic
      // За простота в това демо приемаме 0-23 ако е във вътрешен кръг (може да се добави дистанция)
      // Тук ще сложим logic за 0-11 или 1-12 за сега
      // В оригинала имаше 2 кръга за часовете, тук опростяваме: 0-23 по ъгъл
      // Ако е 12ч часовник:
      if (h === 12) h = 0; // За логиката 0-23
      
      // Нека направим стандартен 24ч мапинг ако потребителят кликне
      // (Това изисква distance check за вътрешен/външен кръг, ще го пропуснем за краткост)
      // Приемаме стандартен часовник 1-12. Ако потребителят иска 13-24, често се прави с бутон или distance.
      // За този пример: 
      this.currentTime.h = h;
    } else {
      let m = Math.round(deg / 6);
      if (m === 60) m = 0;
      this.currentTime.m = m;
    }
    
    this.updateClockHands();
    this.updateReadout();
  },

  updateClockHands: function() {
    const degH = (this.currentTime.h % 12) * 30; // + this.currentTime.m * 0.5;
    const degM = this.currentTime.m * 6;
    
    this.els.handH.style.transform = `translate(-50%, -100%) rotate(${degH}deg)`;
    this.els.handM.style.transform = `translate(-50%, -100%) rotate(${degM}deg)`;
  },

  updateReadout: function() {
    const hStr = String(this.currentTime.h).padStart(2, '0');
    const mStr = String(this.currentTime.m).padStart(2, '0');
    
    // Запълване на спановете (цифрите)
    // Това е опростено, в оригинала има анимации на digit-ите
    this.els.readH.innerText = hStr;
    this.els.readM.innerText = mStr;
  },

  triggerSave: function(mode) {
    if (this.callback) {
      const hStr = String(this.currentTime.h).padStart(2, '0');
      const mStr = String(this.currentTime.m).padStart(2, '0');
      this.callback(`${hStr}:${mStr}`, mode);
    }
    this.close();
  },

  renderTicks: function() {
    // Генериране на чертичките за часове (12) и минути (опционално)
    // Тук добавяме елементи към ringH и ringM
    for (let i = 1; i <= 12; i++) {
      const tick = document.createElement('div');
      tick.className = 'clk-tick hour';
      const angle = i * 30;
      // Позициониране по кръг
      const radius = 80; // px
      const x = Math.sin(angle * Math.PI/180) * radius;
      const y = -Math.cos(angle * Math.PI/180) * radius;
      
      tick.style.transform = `translate(${x}px, ${y}px)`;
      tick.textContent = i;
      this.els.ringH.appendChild(tick);
    }
    
    // За минутите (през 5)
    for (let i = 0; i < 60; i+=5) {
      const tick = document.createElement('div');
      tick.className = 'clk-tick minor';
      const angle = i * 6;
      const radius = 110;
      const x = Math.sin(angle * Math.PI/180) * radius;
      const y = -Math.cos(angle * Math.PI/180) * radius;
      tick.style.transform = `translate(${x}px, ${y}px)`;
      tick.textContent = i;
      this.els.ringM.appendChild(tick);
    }
  }
};