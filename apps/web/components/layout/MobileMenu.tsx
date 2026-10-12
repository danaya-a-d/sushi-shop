"use client";

import { useEffect, useState } from "react";
import { BurgerIcon, CloseIcon } from "@/components/ui/icons";
import { NavLinks } from "./NavLinks";
import { SocialLinks } from "./SocialLinks";

const MENU_ID = "mobile-menu";

/**
 * Бургер и полноэкранное меню для экранов уже `lg`.
 * Оверлей лежит под содержимым шапки (z-index: -1 внутри её stacking context),
 * поэтому логотип и иконки остаются видны, а кнопка превращается в крестик.
 */
export function MobileMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setOpen(false);

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    mediaQuery.addEventListener("change", onChange);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
      mediaQuery.removeEventListener("change", onChange);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={MENU_ID}
        aria-label={open ? "Закрыть меню" : "Открыть меню"}
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-[16.1px] w-[32.2px] items-center justify-self-start after:absolute after:-inset-x-1.5 after:-inset-y-3.5 after:content-[''] md:h-[21.8px] md:w-[41px] lg:hidden"
      >
        {open ? (
          <CloseIcon className="size-[22px] shrink-0 md:size-[30px]" />
        ) : (
          <BurgerIcon className="size-full" />
        )}
      </button>

      {open && (
        <div
          id={MENU_ID}
          className="fixed inset-0 -z-10 flex flex-col items-center overflow-y-auto bg-white px-5 pt-[calc(72px+80px)] pb-9 md:pt-[calc(115px+90px)] md:pb-[50px] lg:hidden"
        >
          <nav aria-label="Главное меню">
            <NavLinks
              className="flex flex-col items-center gap-10 md:gap-[65px]"
              linkClassName="text-2xl md:text-4xl"
              onNavigate={() => setOpen(false)}
            />
          </nav>
          <SocialLinks className="mt-auto gap-[34px] pt-10" />
        </div>
      )}
    </>
  );
}
