import type { Ref } from "react";

type Size = "l" | "s";

type QuantityControlProps = {
  quantity: number;
  /** Верхний предел: при достижении «+» неактивен */
  max: number;
  /** Нужен для подписей кнопок: «Уменьшить количество: …» */
  productName: string;
  onDecrement: () => void;
  onIncrement: () => void;
  size?: Size;
  className?: string;
  /** Чтобы родитель мог вернуть фокус на «+» после замены кнопки «Купить» */
  incrementRef?: Ref<HTMLButtonElement>;
};

// Минимальная ширина с запасом под «99 шт»: контрол не меняет ширину при смене
// количества. Тот же размер получает кнопка «Купить» (см. AddToCartButton),
// поэтому при замене кнопки на контрол соседние элементы не сдвигаются.
export const controlMinWidth: Record<Size, string> = {
  s: "md:min-w-[120px]",
  l: "min-w-[190px] md:min-w-[250px]",
};

const sizes: Record<Size, { box: string; step: string; value: string; icon: string }> = {
  s: {
    box: "h-8 md:h-11",
    step: "w-10 md:w-8",
    value: "text-base",
    icon: "size-3.5",
  },
  l: {
    box: "h-[54px] md:h-[67px]",
    step: "w-[60px] md:w-20",
    value: "text-xl md:text-2xl",
    icon: "size-[18px] md:size-5",
  },
};

const stepBase =
  "relative flex h-full shrink-0 cursor-pointer items-center justify-center text-primary transition-ui-fast after:absolute after:-inset-y-1.5 after:inset-x-0 after:content-[''] focus-visible:bg-lavender focus-visible:outline-offset-[-2px]! aria-disabled:cursor-default aria-disabled:opacity-40";

/**
 * Только отображение: количество и кнопки «−» / «+». Своего состояния и
 * правил корзины нет, всё приходит пропсами. «+» при max остаётся в фокусной
 * цепочке (aria-disabled, а не disabled), чтобы не терять клавиатурный фокус.
 */
export function QuantityControl({
  quantity,
  max,
  productName,
  onDecrement,
  onIncrement,
  size = "s",
  className = "",
  incrementRef,
}: QuantityControlProps) {
  const s = sizes[size];
  const atMax = quantity >= max;

  return (
    <div
      role="group"
      aria-label={`Количество: ${productName}`}
      className={`grid grid-cols-[auto_1fr_auto] items-center rounded-full border border-primary bg-white ${s.box} ${controlMinWidth[size]} ${className}`}
    >
      <button
        type="button"
        aria-label={`Уменьшить количество: ${productName}`}
        onClick={onDecrement}
        className={`${stepBase} ${s.step} rounded-l-full hover:bg-lavender`}
      >
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" className={s.icon}>
          <path d="M1.5 7h11" />
        </svg>
      </button>

      {/* Единственная live-область: скринридер озвучивает новое количество */}
      <span role="status" className={`cursor-default text-center font-medium whitespace-nowrap tabular-nums ${s.value}`}>
        {quantity} шт
      </span>

      <button
        ref={incrementRef}
        type="button"
        aria-label={`Увеличить количество: ${productName}`}
        aria-disabled={atMax}
        onClick={() => {
          if (!atMax) onIncrement();
        }}
        className={`${stepBase} ${s.step} rounded-r-full ${atMax ? "" : "hover:bg-lavender"}`}
      >
        <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" className={s.icon}>
          <path d="M1.5 7h11M7 1.5v11" />
        </svg>
      </button>
    </div>
  );
}
