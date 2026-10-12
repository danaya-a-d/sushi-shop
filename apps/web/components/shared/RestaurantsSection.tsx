import { Container } from "@/components/layout/Container";
import { CropImage } from "@/components/ui/CropImage";
import { SectionTitle } from "@/components/ui/SectionTitle";

const frame =
  "relative h-[256px] overflow-hidden rounded-[30px] md:h-[583px] md:rounded-[50px] lg:flex-1";

export function RestaurantsSection() {
  return (
    <Container as="section">
      <SectionTitle className="text-center">Рестораны</SectionTitle>

      <div className="mt-[30px] flex flex-col gap-5 md:mt-[50px] md:gap-[30px] lg:flex-row">
        {/* Временное статическое изображение; позже заменим на Google Maps */}
        <div className={`${frame} lg:order-2`}>
          <CropImage
            src="/images/restaurants/map.webp"
            alt="Карта с расположением ресторанов"
            crop={{ x: 0.1076, y: 0, width: 0.7848, height: 1 }}
            sizes="(min-width: 1024px) 800px, 100vw"
          />
        </div>
        <div className={`${frame} lg:order-1`}>
          <CropImage
            src="/images/restaurants/cafe.webp"
            alt="Фасад ресторана с зелёным навесом"
            crop={{ x: 0, y: 0.3625, width: 1, height: 0.6173 }}
            sizes="(min-width: 1024px) 700px, 100vw"
          />
        </div>
      </div>
    </Container>
  );
}
