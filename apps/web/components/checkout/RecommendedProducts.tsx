import { ProductCarousel } from "@/components/product/ProductCarousel";
import { getFeaturedProducts } from "@/lib/catalog";

/** «Может понравиться» на checkout: общая карусель товаров с заголовком. Серверный компонент. */
export function RecommendedProducts() {
  return (
    <section aria-labelledby="checkout-recommended-title">
      <ProductCarousel
        id="checkout-recommended"
        products={getFeaturedProducts()}
        className="[--head-gap:30px] md:[--head-gap:40px]"
        heading={
          <h2
            id="checkout-recommended-title"
            className="font-heading text-xl leading-[1.3] md:text-[32px]"
          >
            Может понравиться
          </h2>
        }
      />
    </section>
  );
}
