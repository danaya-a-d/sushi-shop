import type { Metadata } from "next";
import { unstable_rethrow } from "next/navigation";
import { Suspense } from "react";
import { Container } from "@/components/layout/Container";
import { ProductCatalog, ProductCatalogSkeleton } from "@/components/product/ProductCatalog";
import { PromoList } from "@/components/promo/PromoList";
import { DataUnavailable } from "@/components/shared/DataUnavailable";
import { RestaurantsSection } from "@/components/shared/RestaurantsSection";
import { CarouselArrow } from "@/components/ui/CarouselArrow";
import { getCategories, getProducts, getPromos } from "@/lib/catalog";
import { parseCategory, withAllCategory } from "@/lib/catalog-utils";

export const metadata: Metadata = {
  title: "Меню и акции — I love Sushi",
  description: "Суши и роллы с доставкой: акции и полное меню I love Sushi.",
};

const PROMOS_ID = "catalog-promos";

// searchParams — динамические данные, поэтому читаются внутри Suspense;
// остальная страница попадает в статическую оболочку.
async function CatalogResults({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[] }>;
}) {
  const { category } = await searchParams;

  let catalog;
  try {
    // Список категорий — из API: новые категории появляются без изменения кода.
    // Неизвестный slug в URL превращается в «Всё» и в API не отправляется.
    const categories = withAllCategory(await getCategories());
    const active = parseCategory(category, categories);
    catalog = { categories, active, products: await getProducts(active) };
  } catch (error) {
    unstable_rethrow(error);
    return (
      <Container className="mt-10 md:mt-[100px]">
        <DataUnavailable subject="меню" />
      </Container>
    );
  }

  return <ProductCatalog {...catalog} />;
}

export default function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[] }>;
}) {
  return (
    <main className="pb-20 md:pb-[140px] lg:pb-[160px]">
      <h1 className="sr-only">Меню и акции</h1>

      <Container className="relative mt-10 md:mt-[100px]">
        <PromoList promos={getPromos()} layout="carousel" id={PROMOS_ID} />
        <CarouselArrow
          targetId={PROMOS_ID}
          className="absolute top-1/2 right-2 hidden size-[45px] -translate-y-1/2 lg:grid min-[1375px]:right-5 min-[1375px]:translate-x-1/2"
        />
      </Container>

      {/* Заглушка статична и не запрашивает данные: API вызывается один раз, из CatalogResults */}
      <Suspense fallback={<ProductCatalogSkeleton />}>
        <CatalogResults searchParams={searchParams} />
      </Suspense>

      <div className="mt-20 md:mt-[140px] lg:mt-[160px]">
        <RestaurantsSection />
      </div>
    </main>
  );
}
