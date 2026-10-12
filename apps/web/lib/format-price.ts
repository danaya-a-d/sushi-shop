const numberFormat = new Intl.NumberFormat("ru-RU");

export function formatPrice(value: number): string {
  return `${numberFormat.format(value)} грн`;
}

export function formatWeight(grams: number): string {
  return `${grams} г`;
}
