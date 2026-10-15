import Image from "next/image";
import { MaskIcon } from "@/components/ui/MaskIcon";
import { QuantityControl } from "@/components/ui/QuantityControl";
import { MAX_QUANTITY } from "@/lib/cart";
import { formatPrice, formatWeight } from "@/lib/format-price";
import type { Product } from "@/types/product";

type CartItemProps = {
  product: Product;
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
};

/**
 * Позиция корзины. Количество и действия приходят пропсами (состояние в
 * CartProvider). Мобильная раскладка: справа от фото название и «×», вес и
 * сумма позиции, контрол количества; с md цена переходит вниз справа (как в макете).
 */
export function CartItem({
  product,
  quantity,
  onIncrement,
  onDecrement,
  onRemove,
}: CartItemProps) {
  return (
    <li className="flex gap-5">
      <div className="grid h-[97px] w-[116px] shrink-0 place-items-center rounded-[30px] bg-lime md:h-[164px] md:w-[191px] md:rounded-[100px]">
        <div className="relative h-[80%] w-[80%]">
          <Image
            src={product.image.src}
            alt=""
            fill
            sizes="(min-width: 768px) 150px, 93px"
            className="object-contain"
          />
        </div>
      </div>

      <div className="grid min-w-0 flex-1 grid-cols-[1fr_auto] content-start gap-x-3 gap-y-1 md:grid-rows-[auto_auto_1fr]">
        <h3 className="line-clamp-2 font-heading text-base leading-[1.3] md:text-[32px]">
          {product.name}
        </h3>

        <button
          type="button"
          onClick={onRemove}
          aria-label={`Удалить из корзины: ${product.name}`}
          className="relative size-6 cursor-pointer justify-self-end text-primary transition-ui-fast after:absolute after:-inset-2 after:content-[''] hover:text-primary-hover focus-visible:text-primary-hover md:size-8"
        >
          <MaskIcon src="/icons/delete.svg" className="size-full" />
        </button>

        <p className="text-xs leading-[1.3] font-medium opacity-60 md:text-base">
          {formatWeight(product.weight)}
        </p>

        <p className="self-end text-right text-base leading-[1.3] font-medium whitespace-nowrap md:col-start-2 md:row-start-3 md:text-2xl">
          {formatPrice(product.price * quantity)}
        </p>

        <QuantityControl
          quantity={quantity}
          max={MAX_QUANTITY}
          productName={product.name}
          onIncrement={onIncrement}
          onDecrement={onDecrement}
          className="col-span-2 mt-2 w-fit md:col-span-1 md:col-start-1 md:row-start-3 md:mt-0 md:self-end"
        />
      </div>
    </li>
  );
}
