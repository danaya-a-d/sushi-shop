"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { Button } from "@/components/ui/Button";
import { QuantityControl, controlMinWidth } from "@/components/ui/QuantityControl";
import { MAX_QUANTITY } from "@/lib/cart";
import type { Product } from "@/types/product";

type AddToCartButtonProps = {
  /** Товар целиком: корзина сразу покажет его цену и проверит актуальность позже */
  product: Product;
  /** Текст кнопки, пока товара в корзине нет: «Купить», «В корзину» */
  label: string;
  size?: "l" | "s";
  /** Раскладка (место в сетке, ширина): применяется к обёртке, и к кнопке, и к контролу */
  className?: string;
  /** Для кнопки, если видимого текста мало: «Купить: <название>» */
  "aria-label"?: string;
};

/**
 * Связывает корзину с интерфейсом: нет в корзине: кнопка «Купить»; есть:
 * контрол «− N шт +». Количество берётся из общей корзины (useCart), своего
 * state у компонента нет, поэтому оно всегда совпадает с остальными местами,
 * где показан этот товар. До восстановления корзины (isReady = false) показана
 * заблокированная кнопка: на сервере и при первом клиентском рендере так же.
 */
export function AddToCartButton({
  product,
  label,
  size = "l", // как у Button по умолчанию
  className = "",
  "aria-label": ariaLabel,
}: AddToCartButtonProps) {
  const { id: productId, name: productName } = product;
  const { items, isReady, add, increment, decrement } = useCart();
  const quantity = items.find((item) => item.productId === productId)?.quantity ?? 0;

  const wrapperRef = useRef<HTMLDivElement>(null);
  const incrementRef = useRef<HTMLButtonElement>(null);
  // Куда вернуть фокус, если кнопка, на которой он стоял, исчезает при замене.
  // Заполняется только по клику пользователя здесь: изменения из других
  // компонентов фокус не трогают.
  const focusAfterSwap = useRef<"buy" | "increment" | null>(null);

  useEffect(() => {
    if (focusAfterSwap.current === "increment" && quantity > 0) {
      incrementRef.current?.focus();
      focusAfterSwap.current = null;
    } else if (focusAfterSwap.current === "buy" && quantity === 0) {
      wrapperRef.current?.querySelector("button")?.focus();
      focusAfterSwap.current = null;
    }
  }, [quantity]);

  return (
    <div ref={wrapperRef} className={`${controlMinWidth[size]} ${className}`}>
      {quantity === 0 ? (
        <Button
          type="button"
          size={size}
          className="w-full"
          disabled={!isReady}
          aria-label={ariaLabel}
          onClick={() => {
            focusAfterSwap.current = "increment";
            add(productId, product);
          }}
        >
          {label}
        </Button>
      ) : (
        <QuantityControl
          quantity={quantity}
          max={MAX_QUANTITY}
          productName={productName}
          size={size}
          incrementRef={incrementRef}
          onIncrement={() => increment(productId)}
          onDecrement={() => {
            // С 1 до 0 контрол заменяется кнопкой: фокус переносим на неё
            if (quantity === 1) focusAfterSwap.current = "buy";
            decrement(productId);
          }}
        />
      )}
    </div>
  );
}
