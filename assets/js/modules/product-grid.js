/* PRODUCT-GRID.JS (Module Version) */
import { two, todayISO, TODAY } from './utils.js';

export function createProductGrid(options) {
  const TABLE = document.getElementById(options.tableId);
  const INTAKE_BTN = document.getElementById(options.buttonId);
  if (!TABLE) return null;

  const STORAGE_KEY = options.storageKey;
  const PRODUCT_NAME = options.productName;
  const DEFAULT_TIMES = options.defaultTimes; // Array of arrays

  // --- Local State Helpers ---
  function loadState() {
    try {
      const r = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      // Basic validation
      if (r && Array.isArray(r.times)) return r;
    } catch(e){}
    
    // Init defaults
    const times = [];
    const flags = [];
    for(let r=0; r<DEFAULT_TIMES.length; r++) {
        const rowArr = [];
        const flArr = [];
        for(let d=0; d<7; d++) {
            rowArr.push( (DEFAULT_TIMES[r] && DEFAULT_TIMES[r][d]) || "08:00" );
            flArr.push(0); // 0=none, 1=done, 2=skip
        }
        times.push(rowArr);
        flags.push(flArr);
    }
    
    return {
        times: times,
        flag: flags,
        todayDow: (new Date()).getDay(),
        activeDow: (new Date()).getDay() // sync
    };
  }

  function saveState(s) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  }

  let state = loadState();

  // --- Rendering ---
  function render() {
    // Render times in table
    const tbody = TABLE.querySelector('tbody');
    const rows = tbody.querySelectorAll('tr');
    
    state.times.forEach((rowTimes, rIdx) => {
        if(rIdx >= rows.length) return;
        const cells = rows[rIdx].querySelectorAll('td.pl-time-cell');
        
        rowTimes.forEach((tStr, dIdx) => { // dIdx 0..6 (Mon..Sun)
             // Map logic array index to DOM cells (Mon is first)
             // In state: 0=Mon, 1=Tue ... 6=Sun
             if(cells[dIdx]) {
                 cells[dIdx].textContent = tStr;
                 // Set attributes for easier click handling
                 cells[dIdx].dataset.row = rIdx;
                 cells[dIdx].dataset.dayIdx = dIdx; 
                 // Note: We use dayIdx internal (0-6)
                 // But UI uses data-dow (1-7, 0). 
                 // Let's use internal index for cleaner logic here.
             }
        });
    });
    
    // Highlight today
    const dow = (new Date()).getDay(); // 0=Sun, 1=Mon
    // Our array is Mon=0...Sun=6. 
    // JS: Sun=0, Mon=1...
    // Mapping JS dow to our index:
    const todayIdx = (dow === 0) ? 6 : dow - 1;
    
    // We could add 'today' class logic here if not handled by CSS/Layout
  }

  // --- Event Handling ---
  
  // 1. Click on Time Cell -> Open Modal
  TABLE.addEventListener('click', function(e) {
    const td = e.target.closest('.pl-time-cell');
    if (!td) return;
    
    const r = parseInt(td.dataset.row, 10);
    const d = parseInt(td.dataset.dayIdx, 10); // 0..6
    const time = state.times[r][d];
    
    // Map internal index (0=Mon) back to JS Day of Week (1=Mon, 0=Sun)
    const dowJS = (d === 6) ? 0 : d + 1;

    // Dispatch Event
    const event = new CustomEvent('bt-open-modal', {
        detail: {
            productName: PRODUCT_NAME,
            row: r,
            dow: dowJS, // JS standard (0=Sun)
            time: time,
            storageKey: STORAGE_KEY // So we know who sent it
        }
    });
    document.dispatchEvent(event);
  });

  // 2. Listen for Save from Modal
  document.addEventListener('bt-modal-save', function(e) {
    const d = e.detail;
    if(d.storageKey !== STORAGE_KEY) return; // Not for us

    const r = parseInt(d.row, 10);
    const dowJS = parseInt(d.dow, 10);
    const dayIdx = (dowJS === 0) ? 6 : dowJS - 1;

    if(d.applyToAll) {
        // Update entire row
        for(let i=0; i<7; i++) state.times[r][i] = d.newTime;
    } else {
        // Update single cell
        state.times[r][dayIdx] = d.newTime;
    }
    
    saveState(state);
    render();
  });

  // Initial render
  render();

  console.log(`✅ Grid created for ${PRODUCT_NAME}`);
  
  return {
    destroy: () => { /* remove listeners if needed */ },
    updateIntakeStates: () => { /* logic for colors */ }
  };
}