// До копеек: цены из API бывают дробными (12,5 грн); целые показываются без «,00»
const numberFormat = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 });

export function formatPrice(value: number): string {
  return `${numberFormat.format(value)} грн`;
}

export function formatWeight(grams: number): string {
  return `${grams} г`;
}
