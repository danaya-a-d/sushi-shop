import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { formatPrice, formatWeight } from "@/lib/format-price";
import type { Product } from "@/types/product";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const href = `/products/${product.slug}`;

  return (
    <article className="group flex h-full cursor-default flex-col">
      <Link href={href} className="block cursor-pointer rounded-[30px] md:rounded-[100px]">
        <span className="transition-lift grid aspect-[300/230] place-items-center rounded-[inherit] bg-lime group-hover:shadow-promo group-focus-within:shadow-promo">
          <span className="relative block h-[74%] w-[77%]">
            <Image
              src={product.image.src}
              alt=""
              fill
              sizes="(min-width: 1280px) 230px, (min-width: 768px) 270px, 115px"
              className="object-contain"
            />
          </span>
        </span>
      </Link>

      <div className="flex flex-1 flex-col px-px md:pr-0 md:pl-3">
        <h3 className="mt-3 font-heading text-base leading-[1.3] md:text-2xl">
          <Link href={href} className="cursor-pointer transition-ui group-hover:text-primary focus-visible:text-primary">
            {product.name}
          </Link>
        </h3>
        {/* На mobile состав ограничен тремя строками, но место под них зарезервировано, чтобы низ карточек совпадал; полный текст остаётся в данных */}
        <p className="mt-2 line-clamp-3 min-h-[3.9em] text-[12px] leading-[1.3] md:line-clamp-none md:min-h-0 md:text-sm">
          {product.composition}
        </p>

        <div className="mt-auto grid grid-cols-[1fr_auto] pt-3 md:pt-[14px]">
          <p className="text-base font-medium leading-[1.3] md:order-2 md:mt-5 md:self-center md:text-xl">
            {formatPrice(product.price)}
          </p>
          <p className="self-end text-right text-xs font-medium leading-[1.3] opacity-60 md:order-1 md:col-span-2 md:text-left md:text-sm">
            {formatWeight(product.weight)}
          </p>
          <AddToCartButton
            productId={product.id}
            productName={product.name}
            label="Купить"
            size="s"
            aria-label={`Купить: ${product.name}`}
            className="col-span-2 mt-3 w-full md:order-3 md:col-span-1 md:mt-5 md:w-auto"
          />
        </div>
      </div>
    </article>
  );
}
