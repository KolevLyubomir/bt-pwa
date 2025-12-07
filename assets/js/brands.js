"use strict";

/* BRANDS.JS - Данни за продуктите и настройките */

export const BERBERINE_BRANDS = {
  thorne: { name: "Thorne Research", img: "assets/products/additional/ber-thorne.webp", icon: "assets/products/additional/icons/ber-thorne-icon.webp" },
  toniiq: { name: "Toniiq - Ultra High Strength", img: "assets/products/additional/ber-toniiq.webp", icon: "assets/products/additional/icons/ber-toniiq-icon.webp" },
  it: { name: "Integrative Therapeutics", img: "assets/products/additional/ber-it.webp", icon: "assets/products/additional/icons/ber-it-icon.webp" },
  nutricost: { name: "Nutricost", img: "assets/products/additional/ber-nutricost.webp", icon: "assets/products/additional/icons/ber-nutricost-icon.webp" },
  now: { name: "NOW Foods - Berberine Glucose", img: "assets/products/additional/ber-now.webp", icon: "assets/products/additional/icons/ber-now-icon.webp" },
  custom: { name: "Друго (въведи):", img: "assets/products/additional/ber-custom.webp", icon: "assets/products/additional/icons/ber-custom-icon.webp" }
};

export const GLUCOMANNAN_BRANDS = {
  now: { name: "NOW Foods - Glucomannan", img: "assets/products/additional/glu-now.webp", icon: "assets/products/additional/icons/glu-now-icon.webp" },
  swanson: { name: "Swanson Glucomannan", img: "assets/products/additional/glu-swanson.webp", icon: "assets/products/additional/icons/glu-swanson-icon.webp" },
  jarrow: { name: "Jarrow Formulas Glucomannan", img: "assets/products/additional/glu-jarrow.webp", icon: "assets/products/additional/icons/glu-jarrow-icon.webp" },
  lifeext: { name: "Life Extension Glucomannan", img: "assets/products/additional/glu-lifeext.webp", icon: "assets/products/additional/icons/glu-lifeext-icon.webp" },
  custom: { name: "Друго (въведи):", img: "assets/products/additional/glu-custom.webp", icon: "assets/products/additional/icons/glu-custom-icon.webp" }
};

export const EGCG_BRANDS = {
  now: { name: "NOW Foods - EGCg Green Tea", img: "assets/products/additional/egc-now.webp", icon: "assets/products/additional/icons/egc-now-icon.webp" },
  lifeext: { name: "Life Extension Mega Green Tea Extract", img: "assets/products/additional/egc-lifeext.webp", icon: "assets/products/additional/icons/egc-lifeext-icon.webp" },
  jarrow: { name: "Jarrow Green Tea 500mg", img: "assets/products/additional/egc-jarrow.webp", icon: "assets/products/additional/icons/egc-jarrow-icon.webp" },
  swanson: { name: "Swanson Green Tea Extract", img: "assets/products/additional/egc-swanson.webp", icon: "assets/products/additional/icons/egc-swanson-icon.webp" },
  custom: { name: "Друго (въведи):", img: "assets/products/additional/egc-custom.webp", icon: "assets/products/additional/icons/egc-custom-icon.webp" }
};

export const DEFAULT_TIMES_MAP = [
  [],
  [["12:00"]],
  [["08:00"], ["12:00"]],
  [["08:00"], ["12:00"], ["18:00"]],
  [["08:00"], ["12:00"], ["15:00"], ["18:00"]],
  [["08:00"], ["10:00"], ["12:00"], ["15:00"], ["18:00"]],
  [["08:00"], ["10:00"], ["12:00"], ["15:00"], ["18:00"], ["21:00"]]
];