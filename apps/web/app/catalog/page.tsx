import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/layout/Container";
import { ProductCatalog } from "@/components/product/ProductCatalog";
import { PromoList } from "@/components/promo/PromoList";
import { RestaurantsSection } from "@/components/shared/RestaurantsSection";
import { CarouselArrow } from "@/components/ui/CarouselArrow";
import { getPromos, parseCategory } from "@/lib/catalog";

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
  return <ProductCatalog category={parseCategory(category)} />;
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
          className="absolute top-1/2 right-2 hidden -translate-y-1/2 lg:grid min-[1375px]:right-5 min-[1375px]:translate-x-1/2"
        />
      </Container>

      <Suspense fallback={<ProductCatalog />}>
        <CatalogResults searchParams={searchParams} />
      </Suspense>

      <div className="mt-20 md:mt-[140px] lg:mt-[160px]">
        <RestaurantsSection />
      </div>
    </main>
  );
}
