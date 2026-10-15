"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { CartItem } from "@/components/cart/CartItem";
import { useCartDrawer } from "@/components/cart/CartDrawerProvider";
import { useCart } from "@/components/cart/CartProvider";
import { Button } from "@/components/ui/Button";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { getProductById } from "@/lib/catalog";
import { formatPrice } from "@/lib/format-price";

const TITLE_ID = "cart-drawer-title";

/**
 * Корзина в нативном <dialog>. Открытость хранит CartDrawerProvider, а сам
 * диалог открывается и закрывается императивно (showModal / close) в эффекте.
 * showModal даёт «из коробки»: фон недоступен (inert), focus trap, Escape,
 * возврат фокуса на элемент, открывший диалог (CartButton).
 */
export function CartDrawer() {
  const { isOpen, close } = useCartDrawer();
  const { items, total, isReady, increment, decrement, remove } = useCart();
  const pathname = usePathname();

  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const pressStartedOnBackdrop = useRef(false);

  // Синхронизация флага isOpen с состоянием <dialog>. Проверки open нужны:
  // showModal() на уже открытом диалоге бросает ошибку (быстрые клики, Strict Mode).
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    else if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  // Переход на другую страницу закрывает корзину
  useEffect(() => {
    close();
  }, [pathname, close]);

  // Позицию, на которой стоял фокус, удалили вместе с кнопкой: фокус не должен
  // «упасть» на body. Переносим на «Закрыть» (безопаснее, чем на чужую кнопку удаления).
  const lines = items.length;
  const previousLines = useRef(lines);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog?.open && lines < previousLines.current) {
      if (!dialog.contains(document.activeElement)) closeButtonRef.current?.focus();
    }
    previousLines.current = lines;
  }, [lines]);

  const entries = items.flatMap((item) => {
    const product = getProductById(item.productId);
    return product ? [{ product, quantity: item.quantity }] : [];
  });
  const isEmpty = isReady && entries.length === 0;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={TITLE_ID}
      // Нативное закрытие (Escape) тоже должно сбросить флаг. Запоздавшее событие
      // от предыдущего закрытия не должно закрывать уже заново открытый диалог.
      onClose={() => {
        if (!dialogRef.current?.open) close();
      }}
      // Клик по затемнению: сам <dialog> занимает весь экран, панель лежит внутри.
      // Закрываем, только если нажатие и отпускание были вне панели (не выделение текста).
      onMouseDown={(event) => {
        pressStartedOnBackdrop.current = event.target === event.currentTarget;
      }}
      onClick={(event) => {
        if (pressStartedOnBackdrop.current && event.target === event.currentTarget) {
          close();
        }
      }}
      className="cart-drawer m-0 size-full max-h-none max-w-none bg-transparent p-0 text-ink backdrop:bg-accent/50 backdrop:backdrop-blur-[5px]"
    >
      <div className="cart-drawer-panel ml-auto flex h-dvh w-full flex-col bg-white lg:w-[clamp(560px,49vw,945px)]">
        <div className="flex shrink-0 items-center justify-between gap-4 px-5 pt-5 md:pt-[50px] lg:px-10 xl:px-[60px]">
          <SectionTitle as="h2">
            <span id={TITLE_ID}>Корзина</span>
          </SectionTitle>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={close}
            className="cursor-pointer text-base font-medium transition-ui-fast hover:text-primary focus-visible:text-primary md:text-xl"
          >
            Закрыть
          </button>
        </div>

        <div
          aria-busy={!isReady}
          className="mt-[38px] min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 md:mt-[60px] lg:px-10 xl:px-[60px]"
        >
          {isEmpty && (
            <div className="flex h-full flex-col items-center justify-center pb-10 text-center">
              <p className="font-heading text-[28px] leading-[1.3] md:text-4xl">
                Корзина пуста
              </p>
              <p className="mt-4 max-w-[420px] text-base leading-[1.3] md:text-xl">
                Добавьте роллы и суши из меню, и они появятся здесь.
              </p>
              <Button href="/catalog" onClick={close} className="mt-8 md:mt-10">
                Открыть меню
              </Button>
            </div>
          )}

          {isReady && entries.length > 0 && (
            <ul className="flex flex-col gap-5 pb-5 md:gap-[30px]">
              {entries.map(({ product, quantity }) => (
                <CartItem
                  key={product.id}
                  product={product}
                  quantity={quantity}
                  onIncrement={() => increment(product.id)}
                  onDecrement={() => decrement(product.id)}
                  onRemove={() => remove(product.id)}
                />
              ))}
            </ul>
          )}
        </div>

        {entries.length > 0 && (
          <div className="shrink-0 border-t border-accent px-5 pt-5 pb-[max(20px,env(safe-area-inset-bottom))] md:pt-8 md:pb-[max(32px,env(safe-area-inset-bottom))] lg:px-10 xl:px-[60px]">
            <SectionTitle as="h2">
              Итого:
            </SectionTitle>

            {/* Промокод из макета: пока только отображение, проверку добавит backend */}
            <div className="mt-5 md:mt-6">
              <div className="flex opacity-60">
                <input
                  type="text"
                  disabled
                  placeholder="Ввести промокод"
                  aria-label="Промокод"
                  aria-describedby="promo-note"
                  className="h-12 min-w-0 flex-1 rounded-l-full border border-primary bg-lime px-5 text-base placeholder:text-ink/70 md:h-[67px] md:text-2xl"
                />
                <button
                  type="button"
                  disabled
                  className="h-12 shrink-0 rounded-r-full bg-primary px-5 font-heading text-base text-on-accent md:h-[67px] md:px-10 md:text-2xl"
                >
                  Применить
                </button>
              </div>
              <p id="promo-note" className="mt-2 text-xs opacity-60 md:text-sm">
                Промокоды появятся позже.
              </p>
            </div>

            <div className="mt-5 flex items-center justify-between gap-4 md:mt-6">
              <p className="text-xl font-medium whitespace-nowrap md:text-4xl">
                {isReady ? formatPrice(total) : ""}
              </p>
              <Button
                disabled
                aria-describedby="checkout-note"
                className="disabled:opacity-50 disabled:hover:bg-primary"
              >
                Оформить заказ
              </Button>
            </div>
            <p id="checkout-note" className="mt-2 text-right text-xs opacity-60 md:text-sm">
              Оформление заказа скоро будет доступно.
            </p>
          </div>
        )}
      </div>
    </dialog>
  );
}
