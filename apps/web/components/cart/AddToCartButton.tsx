"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { Button } from "@/components/ui/Button";
import { MAX_QUANTITY } from "@/lib/cart";

const ADDED_DURATION_MS = 1500;

type AddToCartButtonProps = {
  productId: string;
  /** Для скринридера: «<название> добавлен в корзину» */
  productName: string;
  /** Обычный текст кнопки: «Купить», «В корзину» */
  label: string;
  size?: "l" | "s";
  className?: string;
  /** Если видимого текста мало для понимания, например «Купить: <название>» */
  "aria-label"?: string;
};

/**
 * Добавляет товар в корзину через useCart(). Drawer не открывает, URL не меняет.
 * На секунду показывает «Добавлено». До восстановления корзины из localStorage
 * (isReady = false) кнопка заблокирована; на сервере и при первом клиентском
 * рендере isReady всегда false, поэтому разметка совпадает.
 */
export function AddToCartButton({
  productId,
  productName,
  label,
  size,
  className = "",
  "aria-label": ariaLabel,
}: AddToCartButtonProps) {
  const { items, isReady, add } = useCart();
  const [added, setAdded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const quantity = items.find((item) => item.productId === productId)?.quantity ?? 0;

  const handleClick = () => {
    // Количество уже максимальное: add ничего не изменит, подтверждение было бы ложным
    if (quantity >= MAX_QUANTITY) return;

    add(productId);
    setAdded(true);
    // Повторное нажатие продлевает показ подтверждения
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setAdded(false), ADDED_DURATION_MS);
  };

  return (
    <>
      <Button
        type="button"
        size={size}
        className={className}
        disabled={!isReady}
        aria-label={ariaLabel}
        onClick={handleClick}
      >
        {added ? "Добавлено" : label}
      </Button>
      {/* Область с постоянным присутствием в DOM: скринридер озвучивает смену текста */}
      <span role="status" className="sr-only">
        {added ? `${productName}: добавлено в корзину` : ""}
      </span>
    </>
  );
}
