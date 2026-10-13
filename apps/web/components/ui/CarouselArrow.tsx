"use client";

type CarouselArrowProps = {
  /** id прокручиваемого списка */
  targetId: string;
  className?: string;
};

/** Стрелка «дальше» для CSS-карусели: прокручивает список на одну карточку, в конце возвращает к началу. */
export function CarouselArrow({ targetId, className = "" }: CarouselArrowProps) {
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

  return (
    <button
      type="button"
      aria-label="Показать следующие акции"
      onClick={scrollNext}
      className={`grid size-[45px] place-items-center rounded-full bg-lavender transition-colors hover:bg-primary/40 focus-visible:bg-primary/40 ${className}`}
    >
      <svg
        viewBox="0 0 11.5 21.4"
        fill="none"
        stroke="#150d1d"
        strokeWidth="1.5"
        aria-hidden="true"
        className="h-[14px] w-[8px]"
      >
        <path d="M1 1l9.5 9.7L1 20.4" />
      </svg>
    </button>
  );
}
