// Демонстрационные товары для проверки пагинации, фильтров и рекомендаций на «большом» каталоге.
// НЕ входят в основной seed. Все id и slug начинаются с `demo-`, по этому префиксу их находят
// и удаляют (см. clean-demo.ts), основные товары (id "1"…"8") не затрагиваются.
import { products as baseProducts } from './seed-data.js';

export const DEMO_PREFIX = 'demo-';

const uah = (hryvnias: number): number => hryvnias * 100;

type DemoRow = {
  name: string;
  categories: readonly string[];
  priceUah: number;
  weightGrams: number;
  /** Отличается от порядка id намеренно: часть товаров делит одно значение (проверка tie-break по id) */
  sortOrder: number;
};

// Основные товары занимают sortOrder 0…7. Здесь:
//  - demo-01 и demo-02 делят sortOrder 7 с основным товаром "8" (ничья между демо и основным);
//  - дальше группы по 3–4 товара с одинаковым sortOrder;
// Категория `desserts` намеренно остаётся без товаров (пустое состояние).
const rows: readonly DemoRow[] = [
  { name: 'Демо Ролл Дракон', categories: ['rolls', 'hits'], priceUah: 1190, weightGrams: 420, sortOrder: 7 },
  { name: 'Демо Ролл Токио', categories: ['rolls', 'new'], priceUah: 980, weightGrams: 380, sortOrder: 7 },
  { name: 'Демо Ролл Осака', categories: ['rolls'], priceUah: 1090, weightGrams: 400, sortOrder: 8 },
  { name: 'Демо Ролл Киото', categories: ['rolls', 'hits'], priceUah: 1150, weightGrams: 410, sortOrder: 8 },
  { name: 'Демо Ролл Нагоя', categories: ['rolls'], priceUah: 890, weightGrams: 360, sortOrder: 8 },
  { name: 'Демо Ролл Саппоро', categories: ['rolls', 'new'], priceUah: 1240, weightGrams: 450, sortOrder: 9 },
  { name: 'Демо Ролл Фудзи', categories: ['rolls', 'hits'], priceUah: 1320, weightGrams: 470, sortOrder: 9 },
  { name: 'Демо Ролл Нара', categories: ['rolls'], priceUah: 940, weightGrams: 350, sortOrder: 9 },
  { name: 'Демо Ролл Кобе', categories: ['rolls', 'new'], priceUah: 1010, weightGrams: 390, sortOrder: 10 },
  { name: 'Демо Ролл Хаката', categories: ['rolls'], priceUah: 870, weightGrams: 340, sortOrder: 10 },
  { name: 'Демо Суши Лосось', categories: ['sushi', 'hits'], priceUah: 420, weightGrams: 120, sortOrder: 11 },
  { name: 'Демо Суши Тунец', categories: ['sushi', 'hits'], priceUah: 460, weightGrams: 120, sortOrder: 11 },
  { name: 'Демо Суши Угорь', categories: ['sushi'], priceUah: 520, weightGrams: 130, sortOrder: 11 },
  { name: 'Демо Суши Креветка', categories: ['sushi', 'new'], priceUah: 390, weightGrams: 110, sortOrder: 11 },
  { name: 'Демо Суши Гребешок', categories: ['sushi'], priceUah: 480, weightGrams: 115, sortOrder: 12 },
  { name: 'Демо Суши Омлет', categories: ['sushi'], priceUah: 290, weightGrams: 100, sortOrder: 12 },
  { name: 'Демо Суши Окунь', categories: ['sushi', 'new'], priceUah: 360, weightGrams: 105, sortOrder: 12 },
  { name: 'Демо Суши Краб', categories: ['sushi'], priceUah: 340, weightGrams: 105, sortOrder: 13 },
  { name: 'Демо Сашими Лосось', categories: ['sashimi', 'hits'], priceUah: 890, weightGrams: 150, sortOrder: 14 },
  { name: 'Демо Сашими Тунец', categories: ['sashimi', 'hits'], priceUah: 950, weightGrams: 150, sortOrder: 14 },
  { name: 'Демо Сашими Гребешок', categories: ['sashimi'], priceUah: 1020, weightGrams: 140, sortOrder: 14 },
  { name: 'Демо Сашими Ассорти', categories: ['sashimi', 'new'], priceUah: 1480, weightGrams: 280, sortOrder: 15 },
  { name: 'Демо Сашими Желтохвост', categories: ['sashimi'], priceUah: 1120, weightGrams: 160, sortOrder: 15 },
  { name: 'Демо Суп Мисо', categories: ['soups'], priceUah: 310, weightGrams: 300, sortOrder: 16 },
  { name: 'Демо Суп Рамен', categories: ['soups', 'hits'], priceUah: 520, weightGrams: 450, sortOrder: 16 },
  { name: 'Демо Суп Том Ям', categories: ['soups', 'new'], priceUah: 580, weightGrams: 400, sortOrder: 16 },
  { name: 'Демо Суп Удон', categories: ['soups'], priceUah: 480, weightGrams: 420, sortOrder: 17 },
  { name: 'Демо Суп Сякэ', categories: ['soups'], priceUah: 450, weightGrams: 380, sortOrder: 17 },
  { name: 'Демо Салат Чука', categories: ['salads'], priceUah: 280, weightGrams: 150, sortOrder: 18 },
  { name: 'Демо Салат Тунец', categories: ['salads', 'new'], priceUah: 410, weightGrams: 200, sortOrder: 18 },
  { name: 'Демо Салат Креветки', categories: ['salads'], priceUah: 430, weightGrams: 210, sortOrder: 18 },
  { name: 'Демо Салат Огурец', categories: ['salads'], priceUah: 190, weightGrams: 140, sortOrder: 19 },
  { name: 'Демо Салат Цезарь', categories: ['salads', 'hits'], priceUah: 360, weightGrams: 230, sortOrder: 19 },
  { name: 'Демо Ролл Синдзюку', categories: ['rolls'], priceUah: 1060, weightGrams: 395, sortOrder: 20 },
  { name: 'Демо Ролл Роппонги', categories: ['rolls', 'new'], priceUah: 1180, weightGrams: 430, sortOrder: 20 },
  { name: 'Демо Ролл Гинза', categories: ['rolls', 'hits'], priceUah: 1290, weightGrams: 460, sortOrder: 20 },
  { name: 'Демо Суши Сет', categories: ['sushi', 'rolls'], priceUah: 1650, weightGrams: 600, sortOrder: 21 },
  { name: 'Демо Сашими Сет', categories: ['sashimi', 'sushi'], priceUah: 1750, weightGrams: 520, sortOrder: 21 },
  { name: 'Демо Ролл Максимал', categories: ['rolls', 'hits'], priceUah: 2190, weightGrams: 900, sortOrder: 22 },
  { name: 'Демо Ролл Финал', categories: ['rolls', 'new'], priceUah: 1000, weightGrams: 400, sortOrder: 23 },
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
    priceKopecks: uah(row.priceUah),
    imageSrc: image.imageSrc,
    imageWidth: image.imageWidth,
    imageHeight: image.imageHeight,
    sortOrder: row.sortOrder,
    categorySlugs: row.categories,
  };
});
