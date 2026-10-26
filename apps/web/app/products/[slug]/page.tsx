import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Container } from "@/components/layout/Container";
import { ProductDetails } from "@/components/product/ProductDetails";
import { RelatedProducts } from "@/components/product/RelatedProducts";
import { MediaText } from "@/components/shared/MediaText";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { getProductBySlug, getProducts } from "@/lib/catalog";

// Cache Components требует хотя бы один путь из generateStaticParams. Если при сборке API недоступен,
// отдаём служебный slug: его страница сразу отвечает 404 без обращения к API, а настоящие товары
// рендерятся при первом запросе.
const BUILD_PLACEHOLDER_SLUG = "__build-placeholder__";

// Страницы собираются заранее для товаров из API; остальные slug рендерятся по запросу.
export async function generateStaticParams() {
  try {
    const products = await getProducts();
    return products.map((product) => ({ slug: product.slug }));
  } catch (error) {
    // Сборка не должна зависеть от работающего API: без списка страницы товаров просто
    // не собираются заранее, а рендерятся при первом запросе. Это не подмена данных.
    console.warn("generateStaticParams: каталог недоступен, страницы товаров не будут собраны заранее.", error);
    return [{ slug: BUILD_PLACEHOLDER_SLUG }];
  }
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  if (slug === BUILD_PLACEHOLDER_SLUG) return {};
  const product = await getProductBySlug(slug);
  if (!product) return {};

  return {
    title: `${product.name} — I love Sushi`,
    description: `${product.name}: ${product.composition}.`,
  };
}

export default async function ProductPage({
  params,
}: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  if (slug === BUILD_PLACEHOLDER_SLUG) notFound();
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  return (
    <main className="pb-20 md:pb-[140px] lg:pb-[160px]">
      <Container className="mt-6 md:mt-8 lg:mt-10">
        <Breadcrumbs
          items={[
            { label: "Главная", href: "/" },
            { label: "Меню и акции", href: "/catalog" },
            { label: product.name },
          ]}
        />
      </Container>

      <Container className="mt-6 md:mt-10 lg:mt-[60px]">
        <ProductDetails product={product} />
      </Container>

      <Container className="mt-20 md:mt-[100px] lg:mt-[120px]">
        <Suspense fallback={null}>
          <RelatedProducts product={product} />
        </Suspense>
      </Container>

      <Container as="section" className="mt-10 md:mt-[60px] lg:mt-[80px]">
        <MediaText
          image="/images/restaurants/cafe.webp"
          imageAlt="Фасад ресторана с зелёным навесом"
          imageCrop={{ x: 0, y: 0.36, width: 1, height: 0.64 }}
        >
          <SectionTitle>Загляните к нам</SectionTitle>
          <p className="text-base leading-[1.3] md:text-2xl">
            Уютный зал, внимательная команда и блюда японской кухни, которые
            готовят при вас. Приходите попробовать любимые роллы на месте.
          </p>
          <Button
            href="/about"
            variant="secondary"
            className="self-center lg:self-start"
          >
            Подробнее
          </Button>
        </MediaText>
      </Container>
    </main>
  );
}
