/** Категории приходят из API (PostgreSQL): список заранее не известен, поэтому slug — строка. */
export type CategorySlug = string;

/** `all` — не категория товара, а сброс фильтра («Всё»): в API он не отправляется. */
export const ALL_CATEGORY = "all";

export type Category = {
  slug: CategorySlug;
  label: string;
};
