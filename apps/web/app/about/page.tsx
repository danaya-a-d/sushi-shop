import type { Metadata } from "next";
import Image from "next/image";
import { Container } from "@/components/layout/Container";
import {
  ABOUT_HERO_CIRCLES,
  DecorCircles,
} from "@/components/shared/DecorCircles";
import { MediaText } from "@/components/shared/MediaText";
import { RestaurantsSection } from "@/components/shared/RestaurantsSection";
import { SectionTitle } from "@/components/ui/SectionTitle";

export const metadata: Metadata = {
  title: "О нас — I love Sushi",
  description:
    "I love Sushi: суши и роллы, в которых важны свежие ингредиенты, аккуратная подача и вкус. Наша философия и подход к приготовлению.",
};

const sectionGap = "mt-20 md:mt-[140px] lg:mt-[160px]";
const paragraph = "text-base leading-[1.3] md:text-2xl";

const team = [
  { role: "Шеф-повар", image: "/images/about/staff-01.webp" },
  { role: "Помощник повара", image: "/images/about/staff-02.webp" },
  { role: "Доставщик еды", image: "/images/about/staff-03.webp" },
  { role: "Главный менеджер", image: "/images/about/staff-04.webp" },
] as const;

// Порядок для mobile; на md и выше фото ставятся по сетке (см. gallery-классы)
const gallery = [
  {
    src: "/images/about/gallery-03.webp",
    alt: "Миска риса с креветками",
    place: "md:col-start-1 md:row-start-3",
  },
  {
    src: "/images/about/gallery-02.webp",
    alt: "Рис с креветками на деревянной доске",
    place: "md:col-start-3 md:row-start-1",
  },
  {
    src: "/images/about/gallery-01.webp",
    alt: "Большое блюдо с роллами и зеленью",
    place: "col-span-2 md:col-span-2 md:col-start-1 md:row-span-2 md:row-start-1",
  },
  {
    src: "/images/about/gallery-04.webp",
    alt: "Роллы на белой тарелке",
    place: "md:col-start-2 md:row-start-3",
  },
  {
    src: "/images/about/gallery-05.webp",
    alt: "Суши на тарелке, которые берут палочками",
    place: "md:col-start-3 md:row-span-2 md:row-start-2",
  },
] as const;

// Имена файлов в public/images/about перепутаны относительно макета: cooking.webp — это кадр
// «Наша философия» (блюдо с соевым соусом), philosophy.webp — «Подход к готовке» (руки повара).
export default function AboutPage() {
  return (
    <main className="pb-20 md:pb-[140px] lg:pb-[160px]">
      {/* Первый экран. На desktop зелёная плашка уходит под прозрачный Header */}
      <section className="bg-lime lg:-mt-[115px]">
        <Container className="relative flex min-h-[214px] flex-col items-center justify-center py-10 text-center md:min-h-[483px] lg:min-h-[580px] lg:pt-[115px]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-5 top-1/2 mx-auto hidden aspect-[1073/414] max-w-[1073px] -translate-y-1/2 md:block lg:top-[calc(50%+57px)]"
          >
            <DecorCircles circles={ABOUT_HERO_CIRCLES} />
          </div>

          <div className="relative">
            <h1 className="font-heading text-5xl leading-none md:text-8xl">
              О нас
            </h1>
            <p className="mx-auto mt-6 max-w-[665px] text-base leading-[1.3] md:mt-10 md:text-2xl">
              Суши и роллы на любой вкус: от классики до запечённых новинок.
            </p>
          </div>
        </Container>
      </section>

      <Container as="section" className="mt-[60px] md:mt-[100px] lg:mt-[160px]">
        <MediaText
          image="/images/about/cooking.webp"
          imageAlt="Роллы с овощами и соевым соусом на светлой тарелке"
          imageCrop={{ x: 0, y: 0.024, width: 1, height: 0.952 }}
        >
          <SectionTitle>Наша философия</SectionTitle>
          <div className="flex flex-col gap-[1.3em]">
            <p className={paragraph}>
              Мы любим суши за простоту: свежий рис, хорошая рыба и ничего
              лишнего. Хороший ролл вкусен не потому, что он сложный, а потому,
              что собран с вниманием.
            </p>
            <p className={paragraph}>
              В меню есть привычная классика и более яркие сочетания с
              авокадо, сливочным сыром и хрустящей корочкой. Выбирайте то, что
              по душе, и пробуйте новое.
            </p>
            <p className={paragraph}>
              Нам важно, чтобы заказ приятно было открыть: аккуратная подача,
              понятный состав и вкус, к которому хочется вернуться.
            </p>
          </div>
        </MediaText>
      </Container>

      <section className={`bg-lime py-[60px] md:py-20 ${sectionGap}`}>
        <Container>
          <SectionTitle className="text-center">Наша команда</SectionTitle>
          <ul className="mx-auto mt-10 grid max-w-[1090px] grid-cols-2 gap-x-5 gap-y-10 md:mt-[60px] md:max-w-[530px] md:gap-x-[30px] md:gap-y-[50px] lg:max-w-none lg:grid-cols-4">
            {team.map((member) => (
              <li key={member.role} className="text-center">
                <div className="relative mx-auto aspect-square w-full max-w-[250px] overflow-hidden rounded-full">
                  <Image
                    src={member.image}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 250px, 150px"
                    className="object-cover"
                  />
                </div>
                <h3 className="mt-4 font-heading text-2xl leading-[1.3] md:mt-5 md:text-4xl">
                  {member.role}
                </h3>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <Container as="section" className={sectionGap}>
        <MediaText
          reverse
          image="/images/about/philosophy.webp"
          imageAlt="Повар собирает суши с креветками"
          imageCrop={{ x: 0.1515, y: 0, width: 0.697, height: 1 }}
        >
          <SectionTitle>Подход к готовке</SectionTitle>
          <div className="flex flex-col gap-[1.3em]">
            <p className={paragraph}>
              Роллы собирают из простых частей: рис, нори, начинка. Порции
              аккуратные, чтобы был слышен вкус каждого ингредиента.
            </p>
            <p className={paragraph}>
              Рыбу и овощи режут тонко, рис приправляют мягко, а запечённые
              роллы подают горячими. Так сочетания остаются лёгкими.
            </p>
            <p className={paragraph}>
              Мы не гонимся за сложностью: хороший ролл — это баланс текстур и
              температур, и именно его мы стараемся получить.
            </p>
          </div>
        </MediaText>
      </Container>

      <Container as="section" className={sectionGap}>
        <SectionTitle className="text-center">Галерея</SectionTitle>
        <ul className="mt-[30px] grid grid-cols-2 gap-5 md:mt-[60px] md:aspect-[1290/936] md:grid-cols-[372fr_372fr_486fr] md:grid-rows-[322fr_178fr_376fr] lg:gap-[30px]">
          {gallery.map((photo) => (
            <li
              key={photo.src}
              className={`relative aspect-[4/3] overflow-hidden rounded-[30px] md:aspect-auto md:rounded-[50px] ${photo.place}`}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(min-width: 1024px) 770px, (min-width: 768px) 480px, 50vw"
                className="object-cover"
              />
            </li>
          ))}
        </ul>
      </Container>

      <div className={sectionGap}>
        <RestaurantsSection />
      </div>
    </main>
  );
}
