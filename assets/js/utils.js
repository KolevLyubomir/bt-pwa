"use strict";

/**
 * UTILS.JS
 * Глобални помощни функции
 */

// 1. Форматира число с водеща нула (напр. 5 -> "05")
function two(n) {
  return String(n).padStart(2, "0");
}

// 2. Връща днешна дата в ISO формат (YYYY-MM-DD), съобразена с локалната зона
function todayISO() {
  var d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

// 3. Конвертира число в Римски цифри (за часовника)
function toRoman(num) {
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

// 4. Глобална константа за днешния ден (ползва се от data.js и product-grid.js)
const TODAY = todayISO();