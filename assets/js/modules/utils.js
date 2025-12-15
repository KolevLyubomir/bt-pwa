/**
 * UTILS.JS (Module Version)
 * Глобални помощни функции
 */

// 1. Форматира число с водеща нула (напр. 5 -> "05")
export function two(n) {
  return String(n).padStart(2, "0");
}

// 2. Връща днешна дата в ISO формат (YYYY-MM-DD)
export function todayISO() {
  var d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

// 3. Конвертира число в Римски цифри
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

// 5. Превръща "HH:MM" в минути от началото на деня
export function timeToMin(str) {
  if (!str) return 0;
  const [h, m] = str.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}