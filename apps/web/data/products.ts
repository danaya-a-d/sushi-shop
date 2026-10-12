import type { Product } from "@/types/product";

const COMPOSITION =
  "окунь, красная рыба, сливочный сыр, омлет, салат айсберг, масаго, сырный соус";

// Моковые данные. Названия сопоставлены с изображениями roll-01…08 по порядку.
export const products: readonly Product[] = [
  {
    id: "1",
    slug: "baked-crab",
    name: "Запеченный краб",
    composition: COMPOSITION,
    weight: 450,
    price: 1250,
    image: { src: "/images/products/roll-01.webp", width: 2670, height: 2750 },
  },
  {
    id: "2",
    slug: "rainbow",
    name: "Радуга",
    composition: COMPOSITION,
    weight: 450,
    price: 1250,
    image: { src: "/images/products/roll-02.webp", width: 469, height: 466 },
  },
  {
    id: "3",
    slug: "spicy-crab",
    name: "Краб спайси",
    composition: COMPOSITION,
    weight: 450,
    price: 1250,
    image: { src: "/images/products/roll-03.webp", width: 416, height: 287 },
  },
  {
    id: "4",
    slug: "futomaki",
    name: "Футомаки",
    composition: COMPOSITION,
    weight: 450,
    price: 1250,
    image: { src: "/images/products/roll-04.webp", width: 355, height: 322 },
  },
  {
    id: "5",
    slug: "baked-crab-2",
    name: "Запеченный краб",
    composition: COMPOSITION,
    weight: 450,
    price: 1250,
    image: { src: "/images/products/roll-05.webp", width: 344, height: 294 },
  },
  {
    id: "6",
    slug: "philadelphia-light",
    name: "Филадельфия лайт",
    composition: COMPOSITION,
    weight: 450,
    price: 1250,
    image: { src: "/images/products/roll-06.webp", width: 434, height: 424 },
  },
  {
    id: "7",
    slug: "california-salmon",
    name: "Калифорния с лососем",
    composition: COMPOSITION,
    weight: 450,
    price: 1250,
    image: { src: "/images/products/roll-07.webp", width: 260, height: 243 },
  },
  {
    id: "8",
    slug: "baked-salmon",
    name: "Запеченный лосось",
    composition: COMPOSITION,
    weight: 450,
    price: 1250,
    image: { src: "/images/products/roll-08.webp", width: 291, height: 287 },
  },
];
