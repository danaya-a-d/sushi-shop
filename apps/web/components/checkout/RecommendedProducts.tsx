import { unstable_rethrow } from "next/navigation";
import { ProductCarousel } from "@/components/product/ProductCarousel";
import { getRecommendedProducts } from "@/lib/catalog";

/**
 * «Может понравиться» на checkout: общая карусель товаров с заголовком. Серверный компонент.
 * Блок необязательный: если API недоступен, он просто не показывается (оформление заказа не зависит от него).
 */
export async function RecommendedProducts() {
  let products;
  try {
    products = await getRecommendedProducts();
  } catch (error) {
    unstable_rethrow(error);
    return null;
  }
  if (products.length === 0) return null;

  return (
    <section aria-labelledby="checkout-recommended-title">
      <ProductCarousel
        id="checkout-recommended"
        products={products}
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
