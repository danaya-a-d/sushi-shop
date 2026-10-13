import { PromoCard } from "@/components/promo/PromoCard";
import type { Promo } from "@/types/promo";

type PromoListProps = {
  promos: readonly Promo[];
  /**
   * `grid` (главная): на desktop сетка 3 + 2.
   * `carousel` (каталог): на desktop тоже горизонтальная прокрутка.
   */
  layout?: "grid" | "carousel";
  /** Нужен, чтобы управлять прокруткой снаружи (CarouselArrow) */
  id?: string;
};

const listLayout = {
  grid: "lg:mx-0 lg:my-0 lg:grid lg:snap-none lg:grid-cols-6 lg:gap-x-[30px] lg:gap-y-10 lg:overflow-visible lg:p-0",
  carousel: "lg:mx-0 lg:scroll-px-0 lg:px-0",
};

/**
 * Tablet и mobile: горизонтальная прокрутка со scroll-snap на всю ширину
 * экрана (контент выходит за поля контейнера).
 * Высота карточек в Figma (175 / 250 px) задана как минимум: ряд растягивается
 * по самой высокой карточке, поэтому геометрия карточек в ряду одинакова.
 */
export function PromoList({
  promos,
  layout = "grid",
  id,
}: PromoListProps) {
  const isGrid = layout === "grid";

  return (
    <ul
      id={id}
      className={`scrollbar-hidden -mx-5 -my-2 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-5 px-5 py-2 md:gap-[30px] ${listLayout[layout]}`}
    >
      {promos.map((promo, index) => {
        const wide = isGrid && index >= 3;
        return (
          <li
            key={promo.id}
            className={`@container flex min-h-[175px] w-[121px] shrink-0 snap-start md:min-h-[250px] md:w-[410px] ${
              isGrid
                ? `lg:w-auto ${wide ? "lg:col-span-3" : "lg:col-span-2"}`
                : ""
            }`}
          >
            <PromoCard promo={promo} wide={wide} />
          </li>
        );
      })}
    </ul>
  );
}
