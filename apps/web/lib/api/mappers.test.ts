import { describe, expect, it } from "vitest";
import { makeApiProduct } from "@/test-utils/fixtures";
import { toCategory, toProduct } from "./mappers";

describe("toProduct", () => {
  it("переводит копейки в гривны в одном месте", () => {
    expect(toProduct(makeApiProduct("1", { priceKopecks: 125000 })).price).toBe(1250);
    expect(toProduct(makeApiProduct("1", { priceKopecks: 1250 })).price).toBe(12.5);
    expect(toProduct(makeApiProduct("1", { priceKopecks: 0 })).price).toBe(0);
  });

  it("weightGrams → weight", () => {
    const product = toProduct(makeApiProduct("1", { weightGrams: 320 }));
    expect(product.weight).toBe(320);
    expect(product).not.toHaveProperty("weightGrams");
  });

  it("nutrition: null превращается в отсутствие поля, объект сохраняется", () => {
    expect(toProduct(makeApiProduct("1", { nutrition: null }))).not.toHaveProperty("nutrition");
    const nutrition = { calories: 180, protein: 6, fat: 5, carbs: 27 };
    expect(toProduct(makeApiProduct("1", { nutrition })).nutrition).toEqual(nutrition);
  });

  it("категории — массив slug как есть, в том числе новые, которых нет в коде", () => {
    expect(
      toProduct(makeApiProduct("1", { categories: ["hits", "brand-new-category"] })).categories,
    ).toEqual(["hits", "brand-new-category"]);
  });

  it("сохраняет изображение с размерами и не тянет служебные поля API", () => {
    const product = toProduct(
      makeApiProduct("1", { image: { src: "/a.webp", width: 10, height: 20 } }),
    );
    expect(product.image).toEqual({ src: "/a.webp", width: 10, height: 20 });
    expect(Object.keys(product).sort()).toEqual(
      ["categories", "composition", "id", "image", "name", "price", "slug", "weight"].sort(),
    );
  });
});

describe("toCategory", () => {
  it("копирует slug и label", () => {
    expect(toCategory({ slug: "rolls", label: "Роллы" })).toEqual({
      slug: "rolls",
      label: "Роллы",
    });
  });
});
