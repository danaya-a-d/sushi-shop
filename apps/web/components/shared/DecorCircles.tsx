type Circle = {
  /** Классы цвета фона (text-токены Tailwind) */
  color: string;
  /** Размер и позиция в % от ширины/высоты контейнера */
  size: number;
  left: number;
  top: number;
};

export const HERO_CIRCLES: readonly Circle[] = [
  { color: "bg-primary", size: 21.3, left: 0, top: 49.3 },
  { color: "bg-ink", size: 13.7, left: 56.1, top: 0 },
  // большой круг: на tablet/mobile lavender, на desktop — зелёный
  { color: "bg-lavender lg:bg-accent", size: 30.1, left: 69.9, top: 70.3 },
  { color: "bg-accent", size: 18.1, left: 66.3, top: 3.2 },
];

export const ABOUT_CIRCLES: readonly Circle[] = [
  { color: "bg-lavender", size: 31.3, left: 7.1, top: 0 },
  { color: "bg-primary", size: 22.2, left: 0, top: 20.9 },
  { color: "bg-ink", size: 14.3, left: 0, top: 61.2 },
  { color: "bg-accent", size: 18.8, left: 81.1, top: 81.2 },
];

/** Те же круги, зеркально: для фото справа от текста */
export const ABOUT_CIRCLES_MIRRORED: readonly Circle[] = [
  { color: "bg-lavender", size: 31.3, left: 61.7, top: 0 },
  { color: "bg-primary", size: 22.2, left: 77.8, top: 20.9 },
  { color: "bg-ink", size: 14.3, left: 85.7, top: 61.2 },
  { color: "bg-accent", size: 18.8, left: 0, top: 81.2 },
];

/** Круги первого экрана «О нас» (Figma 1073×414): круги вокруг заголовка */
export const ABOUT_HERO_CIRCLES: readonly Circle[] = [
  { color: "bg-lavender", size: 21.3, left: 0, top: 4.1 },
  { color: "bg-primary", size: 15.1, left: 13.8, top: 0 },
  { color: "bg-accent", size: 9.7, left: 2.8, top: 47.3 },
  { color: "bg-ink", size: 6.7, left: 89.6, top: 38.4 },
  { color: "bg-accent", size: 9.7, left: 90.3, top: 51.7 },
  { color: "bg-primary", size: 15.1, left: 82.6, top: 61.6 },
];

/**
 * Асимметричные круги плашки товара (плашка занимает left 4–96%, top 0–92%
 * обёртки). Рисуются поверх плашки и лишь слегка заходят на её край, фото не
 * перекрывают. Все круги остаются внутри обёртки.
 */
export const PRODUCT_CIRCLES: readonly Circle[] = [
  { color: "bg-ink", size: 9, left: 83, top: 5 },
  { color: "bg-primary", size: 14, left: 0, top: 54 },
  { color: "bg-accent", size: 19, left: 79, top: 76 },
];

type DecorCirclesProps = {
  circles: readonly Circle[];
};

/**
 * Декоративные круги. Контейнер должен быть `relative`; размеры и позиции
 * заданы в процентах от макета, поэтому круги масштабируются вместе с фото.
 */
export function DecorCircles({ circles }: DecorCirclesProps) {
  return (
    <>
      {circles.map((circle, index) => (
        <span
          key={index}
          aria-hidden="true"
          className={`absolute aspect-square rounded-full ${circle.color}`}
          style={{
            width: `${circle.size}%`,
            left: `${circle.left}%`,
            top: `${circle.top}%`,
          }}
        />
      ))}
    </>
  );
}
