import type { Promo } from "@/types/promo";

// Кропы взяты из imageTransform макета Figma.
export const promos: readonly Promo[] = [
  {
    id: "delivery",
    title: "Закажи\nдомой 🏠",
    href: "/catalog",
    tone: "lime",
    image: { src: "/images/promo/promo-01.webp" },
  },
  {
    id: "dish-of-day",
    title: "Блюдо\nдня 📅",
    href: "/catalog",
    tone: "lavender",
    image: {
      src: "/images/promo/promo-02.webp",
      crop: { x: 0.0268, y: 0.236, width: 0.7763, height: 0.5549 },
    },
  },
  {
    id: "right-now",
    title: "Только\nсейчас ⏱",
    href: "/catalog",
    tone: "lime",
    image: {
      src: "/images/hero/about.webp",
      crop: { x: 0.1485, y: 0.1222, width: 0.8158, height: 0.8074 },
    },
  },
  {
    id: "two-for-one",
    title: "Два 🍣\nпо цене\nодного!",
    href: "/catalog",
    tone: "lavender",
    image: {
      src: "/images/promo/promo-03.webp",
      crop: { x: 0.061, y: 0.028, width: 1, height: 0.9528 },
    },
  },
  {
    id: "hot",
    title: "С пылу с\nжару! 🔥",
    href: "/catalog",
    tone: "lime",
    image: {
      src: "/images/promo/promo-04.webp",
      crop: { x: 0.1137, y: 0.1279, width: 0.9486, height: 0.8746 },
    },
  },
];
