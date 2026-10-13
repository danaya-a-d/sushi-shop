import Link from "next/link";
import type { Category, CategorySlug } from "@/types/category";

type CategoryFilterProps = {
  categories: readonly Category[];
  active: CategorySlug;
};

/**
 * Чипы категорий из макета «Меню». Это обычные ссылки `/catalog?category=…`,
 * поэтому работают без JS. Ряд прокручивается по горизонтали на всю ширину
 * экрана (на узких экранах).
 */
export function CategoryFilter({ categories, active }: CategoryFilterProps) {
  return (
    <nav aria-label="Категории меню">
      <ul className="scrollbar-hidden -mx-5 -my-1 flex gap-[19px] overflow-x-auto px-5 py-1 lg:mx-0 lg:px-0">
        {categories.map((category) => {
          const isActive = category.slug === active;
          return (
            <li key={category.slug} className="shrink-0">
              <Link
                href={
                  category.slug === "all"
                    ? "/catalog"
                    : `/catalog?category=${category.slug}`
                }
                scroll={false}
                aria-current={isActive ? "true" : undefined}
                className={`flex h-11 items-center rounded-full border px-[15px] text-xl whitespace-nowrap transition-ui ${
                  isActive
                    ? "border-primary bg-lavender font-medium"
                    : "border-transparent bg-lavender/70 hover:bg-lavender focus-visible:bg-lavender"
                }`}
              >
                {category.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
