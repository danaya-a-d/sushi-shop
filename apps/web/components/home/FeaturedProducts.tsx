import { unstable_rethrow } from "next/navigation";
import { ProductGrid } from "@/components/product/ProductGrid";
import { DataUnavailable } from "@/components/shared/DataUnavailable";
import { getFeaturedProducts } from "@/lib/catalog";

/** «Горячее» на главной: товары из API. Серверный компонент, грузится внутри Suspense. */
export async function FeaturedProducts() {
  let products;
  try {
    products = await getFeaturedProducts();
  } catch (error) {
    // Служебные сигналы Next.js (динамическая отрисовка и т. п.) глотать нельзя
    unstable_rethrow(error);
    return <DataUnavailable subject="меню" />;
  }

  if (products.length === 0) {
    return <p className="py-10 text-center text-xl">Меню пока пусто</p>;
  }
  return <ProductGrid products={products} />;
}
