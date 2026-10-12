import { Container } from "@/components/layout/Container";
import { DecorCircles, HERO_CIRCLES } from "@/components/shared/DecorCircles";
import { Button } from "@/components/ui/Button";
import { CropImage } from "@/components/ui/CropImage";

/**
 * Первый экран. На desktop шапка прозрачная и лежит поверх hero
 * (отрицательный margin компенсирует её высоту).
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden bg-lime lg:-mt-[115px] lg:pt-[115px]">
      <div
        aria-hidden="true"
        className="absolute inset-0 hidden bg-lavender [clip-path:polygon(69.6%_0,100%_0,100%_100%,59.6%_100%)] lg:block"
      />

      <Container className="relative grid gap-y-[25px] pt-[43px] pb-10 md:grid-cols-[minmax(0,1fr)_346px] md:gap-x-5 md:gap-y-10 md:pt-[59px] md:pb-[52px] lg:grid-cols-[minmax(0,520px)_minmax(0,670px)] lg:justify-between lg:gap-x-8 lg:pt-[26px] lg:pb-[73px]">
        <div className="text-center md:col-start-1 md:row-start-1 md:self-end md:text-left">
          <h1 className="font-heading text-5xl leading-none lg:text-7xl xl:text-[96px]">
            Японская кухня
          </h1>
          <p className="mt-[25px] text-base leading-[1.3] md:mt-10 md:text-xl xl:text-2xl">
            Широкий выбор суши и роллов с доставкой по городу, и даже больше!
            Попробовав нашу продукцию, вы забудете обо всём, что выбирали до
            нас.
          </p>
        </div>

        <div className="relative mx-auto aspect-[670/681] w-[246px] md:col-start-2 md:row-span-2 md:row-start-1 md:w-[346px] lg:w-full">
          <div className="absolute top-[3.5%] left-[6%] h-[92.7%] w-[91.5%] overflow-hidden rounded-tl-[100px] rounded-tr-[450px] rounded-br-[450px] rounded-bl-[450px]">
            <CropImage
              src="/images/hero/hero.webp"
              alt="Ролл на чёрной каменной тарелке"
              crop={{ x: 0.18, y: 0.116, width: 0.8183, height: 0.5619 }}
              preload
              sizes="(min-width: 1024px) 750px, 450px"
            />
          </div>
          <DecorCircles circles={HERO_CIRCLES} />
        </div>

        <div className="text-center md:col-start-1 md:row-start-2 md:self-start md:text-left">
          <Button href="/catalog">Открыть меню</Button>
        </div>
      </Container>
    </section>
  );
}
