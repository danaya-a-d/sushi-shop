// До тиынов: целые тенге показываются без «,00», дробные — как «1 250,5 ₸». Пробелы — неразрывные,
// чтобы сумма и знак валюты не переносились на разные строки.
const numberFormat = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });

export function formatPrice(value: number): string {
  return `${numberFormat.format(value)} ₸`;
}

export function formatWeight(grams: number): string {
  return `${grams} г`;
}
