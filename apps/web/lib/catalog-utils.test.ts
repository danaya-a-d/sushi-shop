import { describe, expect, it } from "vitest";
import { makeProduct } from "@/test-utils/fixtures";
import type { Category } from "@/types/category";
import { appendUnique, parseCategory, withAllCategory } from "./catalog-utils";

const apiCategories: Category[] = [
  { slug: "hits", label: "Хиты продаж" },
  { slug: "rolls", label: "Роллы" },
  { slug: "poke", label: "Поке" }, // новая категория: в коде о ней ничего нет
];
const filters = withAllCategory(apiCategories);

describe("withAllCategory", () => {
  it("ставит виртуальную «Всё» первой и сохраняет порядок категорий API", () => {
    expect(filters.map((c) => c.slug)).toEqual(["all", "hits", "rolls", "poke"]);
    expect(filters[0].label).toBe("Всё");
  });
});

describe("parseCategory", () => {
  it("известная категория возвращается как есть, включая добавленную позже", () => {
    expect(parseCategory("hits", filters)).toBe("hits");
    expect(parseCategory("poke", filters)).toBe("poke");
  });

  it("all, отсутствие значения и неизвестная категория дают «Всё»", () => {
    expect(parseCategory("all", filters)).toBe("all");
    expect(parseCategory(undefined, filters)).toBe("all");
    expect(parseCategory("nope", filters)).toBe("all");
    expect(parseCategory("", filters)).toBe("all");
    expect(parseCategory("HITS", filters)).toBe("all");
  });

  it("при повторном параметре берёт первое значение", () => {
    expect(parseCategory(["rolls", "hits"], filters)).toBe("rolls");
    expect(parseCategory(["nope", "hits"], filters)).toBe("all");
  });
});

describe("appendUnique", () => {
  const a = makeProduct("1");
  const b = makeProduct("2");
  const c = makeProduct("3");

  it("добавляет новые товары в конец, сохраняя порядок", () => {
    expect(appendUnique([a, b], [c]).map((p) => p.id)).toEqual(["1", "2", "3"]);
  });

  it("пропускает товары, чей id уже показан", () => {
    expect(appendUnique([a, b], [b, c]).map((p) => p.id)).toEqual(["1", "2", "3"]);
  });

  it("убирает дубли и внутри самой новой страницы", () => {
    expect(appendUnique([a], [b, b, c]).map((p) => p.id)).toEqual(["1", "2", "3"]);
  });

  it("не меняет исходные массивы", () => {
    const current = [a];
    const result = appendUnique(current, [b]);
    expect(current).toHaveLength(1);
    expect(result).not.toBe(current);
  });
});
