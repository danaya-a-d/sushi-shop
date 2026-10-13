import { Container } from "@/components/layout/Container";
import { CategoryFilter } from "@/components/product/CategoryFilter";
import { ProductGrid } from "@/components/product/ProductGrid";
import { getCategories, getProducts } from "@/lib/catalog";
import type { CategorySlug } from "@/types/category";

type ProductCatalogProps = {
  category?: CategorySlug;
};

/** Фильтр категорий и сетка товаров выбранной категории. */
export function ProductCatalog({ category = "all" }: ProductCatalogProps) {
  const products = getProducts(category);

  return (
    <>
      <Container className="mt-10 md:mt-[100px]">
        <CategoryFilter categories={getCategories()} active={category} />
      </Container>

      <Container className="mt-10 md:mt-[60px]">
        {products.length > 0 ? (
          <ProductGrid
            products={products}
            className="md:mx-auto md:max-w-[630px] lg:max-w-none"
          />
        ) : (
          <p className="py-10 text-center text-xl">
            В этой категории пока нет товаров
          </p>
        )}
      </Container>
    </>
  );
}
