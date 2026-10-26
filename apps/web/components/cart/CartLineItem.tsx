import { CartItem } from "@/components/cart/CartItem";
import { MaskIcon } from "@/components/ui/MaskIcon";
import type { CartLineView } from "@/lib/cart-products";

type CartLineItemProps = {
  line: CartLineView;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
};

const UNAVAILABLE_TEXT = {
  inactive: "Товар временно недоступен",
  missing: "Товар удалён из меню",
} as const;

/**
 * Позиция корзины в любом состоянии данных о товаре. Доступный товар — обычный CartItem;
 * недоступный остаётся в списке (его можно только удалить), загружаемый — заглушка того же размера,
 * чтобы список не «прыгал».
 */
export function CartLineItem({ line, onIncrement, onDecrement, onRemove }: CartLineItemProps) {
  if (line.status === "ok") {
    return (
      <CartItem
        product={line.product}
        quantity={line.quantity}
        onIncrement={onIncrement}
        onDecrement={onDecrement}
        onRemove={onRemove}
      />
    );
  }

  if (line.status === "loading") {
    return (
      <li aria-hidden="true" className="flex gap-5">
        <div className="h-[97px] w-[116px] shrink-0 animate-pulse rounded-[30px] bg-lime md:h-[164px] md:w-[191px] md:rounded-[100px]" />
        <div className="flex-1 space-y-3 pt-1">
          <div className="h-5 w-2/3 animate-pulse rounded-full bg-lavender md:h-8" />
          <div className="h-4 w-1/4 animate-pulse rounded-full bg-lavender" />
        </div>
      </li>
    );
  }

  const text =
    line.status === "unavailable" ? UNAVAILABLE_TEXT[line.reason] : "Не удалось загрузить товар";

  return (
    <li
      data-line-status={line.status}
      className="flex gap-5"
    >
      <div className="grid h-[97px] w-[116px] shrink-0 place-items-center rounded-[30px] bg-lime/50 md:h-[164px] md:w-[191px] md:rounded-[100px]" />
      <div className="grid min-w-0 flex-1 grid-cols-[1fr_auto] content-start gap-x-3 gap-y-1">
        <div>
          <p className="font-heading text-base leading-[1.3] md:text-2xl">{text}</p>
          <p className="mt-1 text-xs leading-[1.3] opacity-60 md:text-base">
            {line.status === "unavailable"
              ? "Удалите его из корзины, чтобы оформить заказ."
              : "Проверьте соединение и повторите попытку."}
          </p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Удалить из корзины: ${text.toLowerCase()}`}
          className="relative size-6 cursor-pointer justify-self-end text-primary transition-ui-fast after:absolute after:-inset-2 after:content-[''] hover:text-primary-hover focus-visible:text-primary-hover md:size-8"
        >
          <MaskIcon src="/icons/delete.svg" className="size-full" />
        </button>
      </div>
    </li>
  );
}
