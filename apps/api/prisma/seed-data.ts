// Начальные данные каталога. Скопированы из моков фронтенда (apps/web/data): id, slug, названия
// и пути изображений сохранены. Цены — демонстрационные, в целых тенге (KZT), в БД хранятся в тиынах.
// После перехода фронтенда на API моки будут удалены, и эти данные станут единственным источником.

/** Целые тенге → тиыны (1 ₸ = 100 тиын). */
export const tengeToMinorUnits = (tenge: number): number => tenge * 100;

export const categories = [
  { slug: 'hits', label: 'Хиты продаж' },
  { slug: 'new', label: 'Новинки' },
  { slug: 'sushi', label: 'Суши' },
  { slug: 'rolls', label: 'Роллы' },
  { slug: 'sashimi', label: 'Сашими' },
  { slug: 'soups', label: 'Супы' },
  { slug: 'salads', label: 'Салаты' },
  { slug: 'desserts', label: 'Десерты' },
] as const;

const COMPOSITION =
  'окунь, красная рыба, сливочный сыр, омлет, салат айсберг, масаго, сырный соус';

type SeedProduct = {
  id: string;
  /** Цена в целых тенге */
  priceTenge: number;
  slug: string;
  name: string;
  categories: readonly (typeof categories)[number]['slug'][];
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  image: { src: string; width: number; height: number };
};

const rolls: readonly SeedProduct[] = [
  { id: '1', priceTenge: 3500, slug: 'baked-crab', name: 'Запеченный краб', categories: ['rolls', 'hits'], calories: 180, protein: 6, fat: 5, carbs: 27, image: { src: '/images/products/roll-01.webp', width: 2670, height: 2750 } },
  { id: '2', priceTenge: 3900, slug: 'rainbow', name: 'Радуга', categories: ['rolls', 'hits'], calories: 165, protein: 6, fat: 4, carbs: 26, image: { src: '/images/products/roll-02.webp', width: 469, height: 466 } },
  { id: '3', priceTenge: 3300, slug: 'spicy-crab', name: 'Краб спайси', categories: ['rolls', 'hits'], calories: 190, protein: 7, fat: 6, carbs: 27, image: { src: '/images/products/roll-03.webp', width: 416, height: 287 } },
  { id: '4', priceTenge: 3700, slug: 'futomaki', name: 'Футомаки', categories: ['rolls', 'hits'], calories: 175, protein: 8, fat: 5, carbs: 25, image: { src: '/images/products/roll-04.webp', width: 355, height: 322 } },
  { id: '5', priceTenge: 3600, slug: 'baked-crab-2', name: 'Запеченный краб', categories: ['rolls', 'new'], calories: 160, protein: 6, fat: 3, carbs: 28, image: { src: '/images/products/roll-05.webp', width: 344, height: 294 } },
  { id: '6', priceTenge: 4200, slug: 'philadelphia-light', name: 'Филадельфия лайт', categories: ['rolls', 'new'], calories: 185, protein: 7, fat: 6, carbs: 26, image: { src: '/images/products/roll-06.webp', width: 434, height: 424 } },
  { id: '7', priceTenge: 4500, slug: 'california-salmon', name: 'Калифорния с лососем', categories: ['rolls', 'new'], calories: 170, protein: 8, fat: 4, carbs: 27, image: { src: '/images/products/roll-07.webp', width: 260, height: 243 } },
  { id: '8', priceTenge: 4800, slug: 'baked-salmon', name: 'Запеченный лосось', categories: ['rolls', 'new'], calories: 195, protein: 9, fat: 7, carbs: 25, image: { src: '/images/products/roll-08.webp', width: 291, height: 287 } },
];

export const products = rolls.map((roll) => ({
  id: roll.id,
  slug: roll.slug,
  name: roll.name,
  composition: COMPOSITION,
  weightGrams: 450,
  priceMinorUnits: tengeToMinorUnits(roll.priceTenge),
  calories: roll.calories,
  protein: roll.protein,
  fat: roll.fat,
  carbs: roll.carbs,
  imageSrc: roll.image.src,
  imageWidth: roll.image.width,
  imageHeight: roll.image.height,
  categorySlugs: roll.categories,
}));
