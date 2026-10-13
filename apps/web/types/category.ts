/** `all` — не категория товара, а сброс фильтра («Всё»). */
export type CategorySlug =
  | "all"
  | "hits"
  | "new"
  | "sushi"
  | "rolls"
  | "sashimi"
  | "soups"
  | "salads"
  | "desserts";

export type Category = {
  slug: CategorySlug;
  label: string;
};
