import { unstable_rethrow } from "next/navigation";
import { ProductCarousel } from "@/components/product/ProductCarousel";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { getRelatedCandidates } from "@/lib/catalog";
import { pickRelatedProducts } from "@/lib/catalog-utils";
import type { Product } from "@/types/product";

/**
 * «Может понравиться» на странице товара. Грузится отдельно от самого товара (в Suspense),
 * поэтому сбой или медленный ответ списка не мешает показать товар. Блок необязательный.
 */
export async function RelatedProducts({ product }: { product: Product }) {
  let related;
  try {
    related = pickRelatedProducts(product, await getRelatedCandidates());
  } catch (error) {
    unstable_rethrow(error);
    return null;
  }
  if (related.length === 0) return null;

  return (
    <ProductCarousel
      id="related-products"
      products={related}
      className="[--head-gap:40px] md:[--head-gap:60px]"
      heading={<SectionTitle>Может понравиться</SectionTitle>}
    />
  );
}
