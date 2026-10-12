import Image from "next/image";
import type { ImageCrop } from "@/types/image";

type CropImageProps = {
  src: string;
  alt: string;
  /** Без crop изображение просто заполняет контейнер (object-cover) */
  crop?: ImageCrop;
  /** `sizes` для всего исходного кадра, а не только видимой области */
  sizes: string;
  preload?: boolean;
};

/**
 * Показывает часть изображения, как в макете (CROP-заливка Figma).
 * Родитель должен быть `relative` с `overflow-hidden`.
 */
export function CropImage({ src, alt, crop, sizes, preload }: CropImageProps) {
  if (!crop) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        preload={preload}
        className="object-cover"
      />
    );
  }

  // Figma допускает выход области за край кадра; сдвигаем её внутрь
  const x = Math.max(0, Math.min(crop.x, 1 - crop.width));
  const y = Math.max(0, Math.min(crop.y, 1 - crop.height));

  return (
    <span
      className="absolute block"
      style={{
        left: `${(-x / crop.width) * 100}%`,
        top: `${(-y / crop.height) * 100}%`,
        width: `${100 / crop.width}%`,
        height: `${100 / crop.height}%`,
      }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        preload={preload}
        className="object-cover"
      />
    </span>
  );
}
