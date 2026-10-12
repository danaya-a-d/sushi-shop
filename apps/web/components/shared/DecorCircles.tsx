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
