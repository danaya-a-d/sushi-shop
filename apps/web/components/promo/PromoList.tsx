import { PromoCard } from "@/components/promo/PromoCard";
import type { Promo } from "@/types/promo";

type PromoListProps = {
  promos: readonly Promo[];
};

/**
 * Desktop: сетка 3 + 2. Tablet и mobile: горизонтальная прокрутка со scroll-snap
 * на всю ширину экрана (контент выходит за поля контейнера).
 * Высота карточек в Figma (175 / 250 px) задана как минимум: ряд растягивается
 * по самой высокой карточке, поэтому геометрия карточек в ряду одинакова.
 */
export function PromoList({ promos }: PromoListProps) {
  return (
    <ul className="scrollbar-hidden -mx-5 -my-2 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-5 px-5 py-2 md:gap-[30px] lg:mx-0 lg:my-0 lg:grid lg:snap-none lg:grid-cols-6 lg:gap-x-[30px] lg:gap-y-10 lg:overflow-visible lg:p-0">
      {promos.map((promo, index) => {
        const wide = index >= 3;
        return (
          <li
            key={promo.id}
            className={`@container flex min-h-[175px] w-[121px] shrink-0 snap-start md:min-h-[250px] md:w-[410px] lg:w-auto ${
              wide ? "lg:col-span-3" : "lg:col-span-2"
            }`}
          >
            <PromoCard promo={promo} wide={wide} />
          </li>
        );
      })}
    </ul>
  );
}
