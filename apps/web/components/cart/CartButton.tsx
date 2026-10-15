"use client";

import { useCart } from "@/components/cart/CartProvider";
import { useCartDrawer } from "@/components/cart/CartDrawerProvider";
import { MaskIcon } from "@/components/ui/MaskIcon";

/** Иконка корзины в Header: открывает CartDrawer, показывает число товаров. */
export function CartButton() {
  const { count, isReady } = useCart();
  const { isOpen, open } = useCartDrawer();

  // До восстановления из localStorage count = 0 не из-за пустой корзины: бейдж не показываем
  const showBadge = isReady && count > 0;

  return (
    <button
      type="button"
      onClick={open}
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      aria-label={showBadge ? `Корзина, товаров: ${count}` : "Корзина"}
      className="relative block cursor-pointer text-ink transition-ui-fast after:absolute after:-inset-x-[7px] after:-inset-y-2.5 after:content-[''] hover:text-primary focus-visible:text-primary"
    >
      <MaskIcon
        src="/icons/cart.svg"
        className="aspect-[34/35] w-6 md:w-[30px] lg:w-[34px]"
      />
      {showBadge && (
        <span
          aria-hidden="true"
          className="absolute -top-1.5 -right-2 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-primary px-1 text-[11px] leading-none font-medium text-on-accent md:-top-2 md:h-5 md:min-w-5 md:text-xs"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
