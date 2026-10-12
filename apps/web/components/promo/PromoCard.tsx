import Link from "next/link";
import { CropImage } from "@/components/ui/CropImage";
import type { Promo } from "@/types/promo";

const tones: Record<Promo["tone"], string> = {
  lime: "bg-lime",
  lavender: "bg-lavender",
};

type PromoCardProps = {
  promo: Promo;
  /** Широкая карточка нижнего ряда на desktop: заголовок мельче относительно ширины */
  wide?: boolean;
};

/**
 * Mobile: заголовок сверху, фото снизу (73 px, как в макете). Остальное
 * место отдаётся тексту, а при длинном заголовке карточка растёт вместе
 * с соседями по ряду.
 * md+: пилюля — текст слева, фото справа. Размер заголовка считается от
 * ширины карточки (`cqw`), поэтому текст не доходит до фото при любой ширине:
 * в макете 32 px при 410 px (7,8 %) и 36 px при 630 px (5,7 %).
 */
export function PromoCard({ promo, wide = false }: PromoCardProps) {
  return (
    <Link
      href={promo.href}
      className={`flex w-full flex-col overflow-hidden rounded-[30px] transition-shadow hover:shadow-promo focus-visible:shadow-promo md:flex-row md:rounded-full ${tones[promo.tone]}`}
    >
      <span
        className={`grid min-w-0 flex-1 place-items-center px-2 py-3 text-center font-heading text-xl leading-[1.3] wrap-break-word whitespace-pre-line md:px-[4cqw] md:py-0 ${
          wide ? "md:text-[5.7cqw]" : "md:text-[7.8cqw]"
        }`}
      >
        {promo.title}
      </span>
      <span className="relative h-[73px] overflow-hidden w-full shrink-0 md:h-auto md:w-[46.5%]">
        <CropImage
          src={promo.image.src}
          crop={promo.image.crop}
          alt=""
          sizes="(min-width: 1024px) 450px, 300px"
        />
      </span>
    </Link>
  );
}
