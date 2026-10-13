import Image from "next/image";
import { NutritionFacts } from "@/components/product/NutritionFacts";
import { DecorCircles, PRODUCT_CIRCLES } from "@/components/shared/DecorCircles";
import { Button } from "@/components/ui/Button";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { formatPrice, formatWeight } from "@/lib/format-price";
import type { Product } from "@/types/product";

type ProductDetailsProps = {
  product: Product;
};

/**
 * Desktop: плашка слева, информация справа по центру относительно фото.
 * Tablet и mobile: одна колонка. Плашка (lime, радиус 100/450/450/450 как у
 * hero) занимает ~92% обёртки; круги лежат поверх неё у края и не выходят
 * за обёртку.
 * Информация в трёх группах: название + состав + вес, пищевая ценность
 * (если есть данные), зона покупки (цена + кнопка).
 */
export function ProductDetails({ product }: ProductDetailsProps) {
  return (
    <div className="grid gap-y-8 md:mx-auto md:max-w-[630px] md:gap-y-10 lg:max-w-none lg:grid-cols-[minmax(0,630px)_minmax(0,520px)] lg:items-center lg:justify-between lg:gap-x-12">
      <div className="relative aspect-[630/620] w-full">
        <div className="absolute top-0 left-[4%] grid h-[92%] w-[92%] place-items-center rounded-tl-[40px] rounded-tr-[130px] rounded-br-[130px] rounded-bl-[130px] bg-lime md:rounded-tl-[100px] md:rounded-tr-[300px] md:rounded-br-[300px] md:rounded-bl-[300px] lg:rounded-tr-[450px] lg:rounded-br-[450px] lg:rounded-bl-[450px]">
          <div className="relative h-[74%] w-[77%]">
            <Image
              src={product.image.src}
              alt={product.name}
              fill
              preload
              sizes="(min-width: 768px) 480px, 280px"
              className="object-contain"
            />
          </div>
        </div>
        <DecorCircles circles={PRODUCT_CIRCLES} />
      </div>

      <div className="flex flex-col gap-6 md:gap-8 lg:gap-9">
        <div>
          <SectionTitle as="h1">{product.name}</SectionTitle>
          <p className="mt-4 text-sm leading-[1.3] md:mt-6 md:text-xl lg:text-2xl">
            {product.composition}
          </p>
          <p className="mt-3 text-sm leading-[1.3] font-medium opacity-60 md:text-base lg:text-xl">
            {formatWeight(product.weight)}
          </p>
        </div>

        {product.nutrition && <NutritionFacts nutrition={product.nutrition} />}

        {/* Зона покупки; кнопка презентационная, корзина будет подключена позже */}
        <div className="flex flex-col gap-4 rounded-[30px] bg-lavender/40 p-5 md:max-lg:flex-row md:max-lg:items-center md:max-lg:justify-between xl:flex-row xl:items-center xl:justify-between md:gap-6 md:rounded-[50px] md:py-6 md:pr-6 md:pl-8">
          <p className="text-3xl leading-[1.3] font-medium md:text-4xl">
            {formatPrice(product.price)}
          </p>
          <Button type="button" className="w-full md:w-auto lg:max-xl:w-full">
            В корзину
          </Button>
        </div>
      </div>
    </div>
  );
}
