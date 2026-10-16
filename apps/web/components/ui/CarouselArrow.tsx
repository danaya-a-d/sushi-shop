"use client";

import { useEffect, useState } from "react";

type CarouselArrowProps = {
  /** id прокручиваемого списка */
  targetId: string;
  /** Размер и положение кнопки задаёт родитель (в макете круг 45 px) */
  className?: string;
  /** Размер иконки; по умолчанию прежний (каталог акций) */
  iconClassName?: string;
  /** Подпись для скринридера */
  label?: string;
};

/**
 * Стрелка «дальше» для CSS-карусели: прокручивает список на одну карточку, в конце возвращает к началу.
 * Если все элементы помещаются без прокрутки, кнопка не отображается.
 */
export function CarouselArrow({
  targetId,
  className = "",
  iconClassName = "h-[14px] w-[8px]",
  label = "Показать следующие акции",
}: CarouselArrowProps) {
  // До первого замера считаем, что прокрутка нужна (так совпадают серверная и первая клиентская разметка)
  const [scrollable, setScrollable] = useState(true);

  useEffect(() => {
    const list = document.getElementById(targetId);
    if (!list) return;

    // Правый padding списка (запас под тень) прокруткой не считается
    const observer = new ResizeObserver(() => {
      const padding = parseFloat(getComputedStyle(list).paddingRight) || 0;
      setScrollable(list.scrollWidth - padding > list.clientWidth + 1);
    });
    observer.observe(list);
    return () => observer.disconnect();
  }, [targetId]);

  function scrollNext() {
    const list = document.getElementById(targetId);
    if (!list) return;

    const [first, second] = Array.from(list.children) as HTMLElement[];
    const step = second ? second.offsetLeft - first.offsetLeft : list.clientWidth;
    const atEnd = list.scrollLeft + list.clientWidth >= list.scrollWidth - 4;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    list.scrollTo({
      left: atEnd ? 0 : list.scrollLeft + step,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }

  if (!scrollable) return null;

  return (
    <button
      type="button"
      aria-label={label}
      onClick={scrollNext}
      className={`grid cursor-pointer place-items-center rounded-full bg-lavender transition-shadow-ui hover:shadow-arrow focus-visible:shadow-arrow ${className}`}
    >
      <svg
        viewBox="0 0 11.5 21.4"
        fill="none"
        stroke="#150d1d"
        strokeWidth="1.5"
        aria-hidden="true"
        className={iconClassName}
      >
        <path d="M1 1l9.5 9.7L1 20.4" />
      </svg>
    </button>
  );
}
