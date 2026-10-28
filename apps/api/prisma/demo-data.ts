// Демонстрационные товары для проверки пагинации, фильтров и рекомендаций на «большом» каталоге.
// НЕ входят в основной seed. Все id и slug начинаются с `demo-`, по этому префиксу их находят
// и удаляют (см. clean-demo.ts), основные товары (id "1"…"8") не затрагиваются.
import { products as baseProducts, tengeToMinorUnits } from './seed-data.js';

export const DEMO_PREFIX = 'demo-';

type DemoRow = {
  name: string;
  categories: readonly string[];
  /** Цена в целых тенге */
  priceTenge: number;
  weightGrams: number;
  /** Отличается от порядка id намеренно: часть товаров делит одно значение (проверка tie-break по id) */
  sortOrder: number;
};

// Основные товары занимают sortOrder 0…7. Здесь:
//  - demo-01 и demo-02 делят sortOrder 7 с основным товаром "8" (ничья между демо и основным);
//  - дальше группы по 3–4 товара с одинаковым sortOrder;
// Категория `desserts` намеренно остаётся без товаров (пустое состояние).
const rows: readonly DemoRow[] = [
  { name: 'Демо Ролл Дракон', categories: ['rolls', 'hits'], priceTenge: 4200, weightGrams: 420, sortOrder: 7 },
  { name: 'Демо Ролл Токио', categories: ['rolls', 'new'], priceTenge: 3400, weightGrams: 380, sortOrder: 7 },
  { name: 'Демо Ролл Осака', categories: ['rolls'], priceTenge: 3800, weightGrams: 400, sortOrder: 8 },
  { name: 'Демо Ролл Киото', categories: ['rolls', 'hits'], priceTenge: 4000, weightGrams: 410, sortOrder: 8 },
  { name: 'Демо Ролл Нагоя', categories: ['rolls'], priceTenge: 3100, weightGrams: 360, sortOrder: 8 },
  { name: 'Демо Ролл Саппоро', categories: ['rolls', 'new'], priceTenge: 4300, weightGrams: 450, sortOrder: 9 },
  { name: 'Демо Ролл Фудзи', categories: ['rolls', 'hits'], priceTenge: 4600, weightGrams: 470, sortOrder: 9 },
  { name: 'Демо Ролл Нара', categories: ['rolls'], priceTenge: 3300, weightGrams: 350, sortOrder: 9 },
  { name: 'Демо Ролл Кобе', categories: ['rolls', 'new'], priceTenge: 3500, weightGrams: 390, sortOrder: 10 },
  { name: 'Демо Ролл Хаката', categories: ['rolls'], priceTenge: 3000, weightGrams: 340, sortOrder: 10 },
  { name: 'Демо Суши Лосось', categories: ['sushi', 'hits'], priceTenge: 900, weightGrams: 120, sortOrder: 11 },
  { name: 'Демо Суши Тунец', categories: ['sushi', 'hits'], priceTenge: 1000, weightGrams: 120, sortOrder: 11 },
  { name: 'Демо Суши Угорь', categories: ['sushi'], priceTenge: 1200, weightGrams: 130, sortOrder: 11 },
  { name: 'Демо Суши Креветка', categories: ['sushi', 'new'], priceTenge: 800, weightGrams: 110, sortOrder: 11 },
  { name: 'Демо Суши Гребешок', categories: ['sushi'], priceTenge: 1100, weightGrams: 115, sortOrder: 12 },
  { name: 'Демо Суши Омлет', categories: ['sushi'], priceTenge: 700, weightGrams: 100, sortOrder: 12 },
  { name: 'Демо Суши Окунь', categories: ['sushi', 'new'], priceTenge: 850, weightGrams: 105, sortOrder: 12 },
  { name: 'Демо Суши Краб', categories: ['sushi'], priceTenge: 750, weightGrams: 105, sortOrder: 13 },
  { name: 'Демо Сашими Лосось', categories: ['sashimi', 'hits'], priceTenge: 2900, weightGrams: 150, sortOrder: 14 },
  { name: 'Демо Сашими Тунец', categories: ['sashimi', 'hits'], priceTenge: 3200, weightGrams: 150, sortOrder: 14 },
  { name: 'Демо Сашими Гребешок', categories: ['sashimi'], priceTenge: 3500, weightGrams: 140, sortOrder: 14 },
  { name: 'Демо Сашими Ассорти', categories: ['sashimi', 'new'], priceTenge: 5400, weightGrams: 280, sortOrder: 15 },
  { name: 'Демо Сашими Желтохвост', categories: ['sashimi'], priceTenge: 3600, weightGrams: 160, sortOrder: 15 },
  { name: 'Демо Суп Мисо', categories: ['soups'], priceTenge: 1500, weightGrams: 300, sortOrder: 16 },
  { name: 'Демо Суп Рамен', categories: ['soups', 'hits'], priceTenge: 2800, weightGrams: 450, sortOrder: 16 },
  { name: 'Демо Суп Том Ям', categories: ['soups', 'new'], priceTenge: 3000, weightGrams: 400, sortOrder: 16 },
  { name: 'Демо Суп Удон', categories: ['soups'], priceTenge: 2600, weightGrams: 420, sortOrder: 17 },
  { name: 'Демо Суп Сякэ', categories: ['soups'], priceTenge: 2400, weightGrams: 380, sortOrder: 17 },
  { name: 'Демо Салат Чука', categories: ['salads'], priceTenge: 1400, weightGrams: 150, sortOrder: 18 },
  { name: 'Демо Салат Тунец', categories: ['salads', 'new'], priceTenge: 2300, weightGrams: 200, sortOrder: 18 },
  { name: 'Демо Салат Креветки', categories: ['salads'], priceTenge: 2500, weightGrams: 210, sortOrder: 18 },
  { name: 'Демо Салат Огурец', categories: ['salads'], priceTenge: 1000, weightGrams: 140, sortOrder: 19 },
  { name: 'Демо Салат Цезарь', categories: ['salads', 'hits'], priceTenge: 2000, weightGrams: 230, sortOrder: 19 },
  { name: 'Демо Ролл Синдзюку', categories: ['rolls'], priceTenge: 3700, weightGrams: 395, sortOrder: 20 },
  { name: 'Демо Ролл Роппонги', categories: ['rolls', 'new'], priceTenge: 4100, weightGrams: 430, sortOrder: 20 },
  { name: 'Демо Ролл Гинза', categories: ['rolls', 'hits'], priceTenge: 4500, weightGrams: 460, sortOrder: 20 },
  { name: 'Демо Суши Сет', categories: ['sushi', 'rolls'], priceTenge: 6500, weightGrams: 600, sortOrder: 21 },
  { name: 'Демо Сашими Сет', categories: ['sashimi', 'sushi'], priceTenge: 7500, weightGrams: 520, sortOrder: 21 },
  { name: 'Демо Ролл Максимал', categories: ['rolls', 'hits'], priceTenge: 8900, weightGrams: 900, sortOrder: 22 },
  { name: 'Демо Ролл Финал', categories: ['rolls', 'new'], priceTenge: 3600, weightGrams: 400, sortOrder: 23 },
];

export const DEMO_PRODUCT_COUNT = 40;

export const demoProducts = rows.map((row, index) => {
  const number = String(index + 1).padStart(2, '0');
  // Изображения переиспользуются у основных товаров, новые файлы не нужны
  const image = baseProducts[index % baseProducts.length];
  return {
    id: `${DEMO_PREFIX}${number}`,
    slug: `${DEMO_PREFIX}${number}`,
    name: row.name,
    composition: 'демонстрационный товар: состав не указан',
    weightGrams: row.weightGrams,
    priceMinorUnits: tengeToMinorUnits(row.priceTenge),
    imageSrc: image.imageSrc,
    imageWidth: image.imageWidth,
    imageHeight: image.imageHeight,
    sortOrder: row.sortOrder,
    categorySlugs: row.categories,
  };
});
