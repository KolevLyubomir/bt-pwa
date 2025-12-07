"use strict";

/**
 * UTILS.JS
 * Глобални помощни функции
 */

// 1. Форматира число с водеща нула (напр. 5 -> "05")
export function two(n) {
  return String(n).padStart(2, "0");
}

// 2. Връща днешна дата в ISO формат (YYYY-MM-DD), съобразена с локалната зона
export function todayISO() {
  var d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

// 3. Конвертира число в Римски цифри (за часовника)
export function toRoman(num) {
  const romans = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ];
  let res = '';
  for (const [v, sym] of romans) {
    while (num >= v) {
      res += sym;
      num -= v;
    }
  }
  return res;
}

// 4. Глобална константа за днешния ден
export const TODAY = todayISO();

// 5. Време към минути (01:00 -> 60)
export function timeStrToMin(str) {
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

// 6. Минути към време (60 -> "01:00")
export function minToTimeStr(min) {
  if (!isFinite(min) || min < 0) min = 0;
  var h = Math.floor(min / 60);
  var m = min % 60;
  if (h > 23) h = 23;
  if (m > 59) m = 59;
  return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
}