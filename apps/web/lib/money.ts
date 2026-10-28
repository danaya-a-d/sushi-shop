// Единственное место, где минимальные единицы валюты (API, БД) превращаются в основные
// (интерфейс) и обратно. Валюта магазина — казахстанский тенге (KZT): 1 ₸ = 100 тиын.

/** Тиыны из API → тенге для интерфейса (`Product.price`). */
export function minorUnitsToMajor(minorUnits: number): number {
  return minorUnits / 100;
}

/** Тенге → целые тиыны: для сумм без накопления ошибки округления (0.1 + 0.2). */
export function majorToMinorUnits(major: number): number {
  return Math.round(major * 100);
}
