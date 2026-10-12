import type { ImageCrop } from "@/types/image";

export type Promo = {
  id: string;
  /** Заголовок; переводы строк (\n) сохраняются */
  title: string;
  href: string;
  tone: "lime" | "lavender";
  image: {
    src: string;
    crop?: ImageCrop;
  };
};
