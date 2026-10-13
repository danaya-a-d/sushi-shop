"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/data/site";

type NavLinksProps = {
  className?: string;
  linkClassName?: string;
  onNavigate?: () => void;
};

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** Основная навигация; активный пункт подчёркнут линией. */
export function NavLinks({
  className = "",
  linkClassName = "",
  onNavigate,
}: NavLinksProps) {
  const pathname = usePathname();

  return (
    <ul className={className}>
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`border-b border-transparent transition-ui hover:text-primary focus-visible:text-primary ${
                active ? "!border-ink" : ""
              } ${linkClassName}`}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
