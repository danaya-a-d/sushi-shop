import { Hero } from "@/components/home/Hero";
import { Container } from "@/components/layout/Container";
import { ProductGrid } from "@/components/product/ProductGrid";
import { PromoList } from "@/components/promo/PromoList";
import { MediaText } from "@/components/shared/MediaText";
import { RestaurantsSection } from "@/components/shared/RestaurantsSection";
import { Button } from "@/components/ui/Button";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { getFeaturedProducts, getPromos } from "@/lib/catalog";

const sectionGap = "mt-20 md:mt-[140px] lg:mt-[160px]";

export default function Home() {
  const promos = getPromos();
  const products = getFeaturedProducts();

  return (
    <main className="pb-20 md:pb-[140px] lg:pb-[160px]">
      <Hero />

      <Container as="section" className="mt-[60px] md:mt-[100px] lg:mt-[160px]">
        <SectionTitle className="text-center lg:text-left">Акции</SectionTitle>
        <div className="mt-[30px] md:mt-[50px]">
          <PromoList promos={promos} />
        </div>
      </Container>

      <Container as="section" className={sectionGap}>
        <SectionTitle className="text-center lg:text-left">Горячее</SectionTitle>
        <div className="mt-[30px] md:mt-[50px]">
          <ProductGrid products={products} />
        </div>
        <div className="mt-10 flex justify-center md:mt-20">
          <Button href="/catalog" variant="secondary">
            Открыть меню
          </Button>
        </div>
      </Container>

      <Container as="section" className={sectionGap}>
        <MediaText
          image="/images/hero/about.webp"
          imageAlt="Блюдо японской кухни на светлой тарелке"
          imageCrop={{ x: 0, y: 0.1822, width: 1, height: 0.6355 }}
        >
          <SectionTitle>О нас</SectionTitle>
          <div>
            <p className="text-base leading-[1.3] md:text-2xl">
              I love Sushi — это суши и роллы, в которых важны простые вещи:
              свежие ингредиенты, аккуратная подача и вкус, к которому хочется
              возвращаться.
            </p>
            <p className="mt-[1.3em] text-base leading-[1.3] md:text-2xl">
              В меню есть классические роллы, запечённые новинки и сочетания с
              авокадо и сливочным сыром. Узнайте, как мы подходим к
              приготовлению.
            </p>
          </div>
          <Button
            href="/about"
            variant="secondary"
            className="self-center lg:self-start"
          >
            Узнать больше
          </Button>
        </MediaText>
      </Container>

      <div className={sectionGap}>
        <RestaurantsSection />
      </div>
    </main>
  );
}
