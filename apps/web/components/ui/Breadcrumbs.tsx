import Link from "next/link";

export type BreadcrumbItem = {
  label: string;
  /** Без href — текущая страница */
  href?: string;
};

type BreadcrumbsProps = {
  items: readonly BreadcrumbItem[];
  className?: string;
};

/** Хлебные крошки; на узких экранах название текущей страницы переносится на следующую строку. */
export function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
  return (
    <nav aria-label="Хлебные крошки" className={className}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-[1.3] md:gap-x-3 md:text-base">
        {items.map((item, index) => (
          <li
            key={item.label}
            className="flex shrink-0 items-center gap-x-2 md:gap-x-3"
          >
            {item.href ? (
              <Link
                href={item.href}
                className="opacity-60 transition-ui hover:text-primary hover:opacity-100 focus-visible:text-primary focus-visible:opacity-100"
              >
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="font-medium">
                {item.label}
              </span>
            )}
            {index < items.length - 1 && (
              <span aria-hidden="true" className="opacity-60">
                /
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
