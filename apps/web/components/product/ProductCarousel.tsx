import type { ReactNode } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { CarouselArrow } from "@/components/ui/CarouselArrow";
import type { Product } from "@/types/product";

type ProductCarouselProps = {
  products: readonly Product[];
  /** id списка нужен стрелке, чтобы управлять его прокруткой; на странице он должен быть уникальным */
  id: string;
  /** Заголовок блока: на mobile стрелка стоит справа от него, поэтому он часть карусели */
  heading: ReactNode;
  /** Отступ заголовка от списка: страницы задают его через CSS-переменную, например `[--head-gap:30px] md:[--head-gap:40px]` */
  className?: string;
};

/**
 * Горизонтальная карусель карточек (CSS scroll-snap, без библиотек). Серверный компонент:
 * клиентскими остаются только стрелка и кнопки покупки внутри ProductCard.
 * Раскладка и расчёт ширины карточек описаны в globals.css (.product-carousel*).
 */
export function ProductCarousel({
  products,
  id,
  heading,
  className = "",
}: ProductCarouselProps) {
  return (
    <div className={`product-carousel ${className}`}>
      <div className="product-carousel-body">
        <div className="product-carousel-heading">{heading}</div>

        <CarouselArrow
          targetId={id}
          label="Показать следующие товары"
          iconClassName="h-[47.6%] w-[25.5%]"
          className="product-carousel-arrow"
        />

        <ul id={id} className="product-carousel-list scrollbar-hidden">
          {products.map((product) => (
            <li key={product.id} className="product-carousel-item">
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
