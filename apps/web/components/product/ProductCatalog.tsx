import { Container } from "@/components/layout/Container";
import { CategoryFilter } from "@/components/product/CategoryFilter";
import { CatalogProducts } from "@/components/product/CatalogProducts";
import { ProductGridSkeleton } from "@/components/product/ProductGridSkeleton";
import type { Category, CategorySlug } from "@/types/category";
import type { ProductsPage } from "@/types/product";

type ProductCatalogProps = {
  /** Фильтры, включая виртуальную «Всё» */
  categories: readonly Category[];
  active: CategorySlug;
  /** Первая страница выбранной категории */
  page: ProductsPage;
};

/**
 * Фильтр категорий и сетка товаров выбранной категории. Первая страница приходит готовой с сервера,
 * следующие подгружает клиентский CatalogProducts.
 */
export function ProductCatalog({ categories, active, page }: ProductCatalogProps) {
  return (
    <>
      <Container className="mt-10 md:mt-[100px]">
        <CategoryFilter categories={categories} active={active} />
      </Container>

      <Container className="mt-10 md:mt-[60px]">
        {page.items.length > 0 ? (
          // key сбрасывает список и курсор при смене категории
          <CatalogProducts
            key={active}
            category={active}
            initialProducts={page.items}
            initialCursor={page.nextCursor}
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

/** Заглушка каталога на время загрузки (фильтры + сетка), без запросов к API. */
export function ProductCatalogSkeleton() {
  return (
    <>
      <Container className="mt-10 md:mt-[100px]">
        <div aria-hidden="true" className="flex gap-[19px] overflow-hidden">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-11 w-[110px] shrink-0 animate-pulse rounded-full bg-lavender/70" />
          ))}
        </div>
      </Container>
      <Container className="mt-10 md:mt-[60px]">
        <ProductGridSkeleton className="md:mx-auto md:max-w-[630px] lg:max-w-none" />
      </Container>
    </>
  );
}
