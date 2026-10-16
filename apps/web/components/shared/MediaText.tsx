import type { ReactNode } from "react";
import { CropImage } from "@/components/ui/CropImage";
import type { ImageCrop } from "@/types/image";
import {
  ABOUT_CIRCLES,
  ABOUT_CIRCLES_MIRRORED,
  DecorCircles,
} from "@/components/shared/DecorCircles";

type MediaTextProps = {
  image: string;
  imageAlt: string;
  imageCrop?: ImageCrop;
  /** На desktop фото справа от текста (круги и форма зеркальны); на узких экранах фото всё равно сверху */
  reverse?: boolean;
  children: ReactNode;
};

/** Фото в органической форме с декоративными кругами и текстовый блок. */
export function MediaText({
  image,
  imageAlt,
  imageCrop,
  reverse = false,
  children,
}: MediaTextProps) {
  return (
    <div
      className={`flex flex-col items-center gap-5 md:gap-[60px] lg:gap-12 xl:gap-[99px] ${
        reverse ? "lg:flex-row-reverse" : "lg:flex-row"
      }`}
    >
      <div className="relative aspect-[608/627] w-full max-w-[611px] lg:flex-1">
        <div
          className={`absolute top-[15%] h-[87.9%] w-[94.6%] overflow-hidden rounded-br-[200px] rounded-bl-[200px] ${
            reverse
              ? "left-0 rounded-tl-[200px] rounded-tr-[90px]"
              : "left-[5.4%] rounded-tl-[90px] rounded-tr-[200px]"
          }`}
        >
          <CropImage
            src={image}
            alt={imageAlt}
            crop={imageCrop}
            sizes="(min-width: 768px) 900px, 450px"
          />
        </div>
        <DecorCircles circles={reverse ? ABOUT_CIRCLES_MIRRORED : ABOUT_CIRCLES} />
      </div>

      <div
        className={`flex w-full max-w-[550px] flex-col gap-5 text-center md:gap-[50px] lg:flex-1 ${
          reverse ? "lg:text-right" : "lg:text-left"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
