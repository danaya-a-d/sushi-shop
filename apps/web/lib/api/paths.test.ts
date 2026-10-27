import { describe, expect, it } from "vitest";
import { CATALOG_PAGE_SIZE, productsPath, relatedProductsPath } from "./paths";

describe("productsPath", () => {
  it("без параметров — /products", () => {
    expect(productsPath()).toBe("/products");
  });

  it("all не отправляется в API", () => {
    expect(productsPath({ category: "all", limit: 12 })).toBe("/products?limit=12");
  });

  it("категория, лимит и курсор; курсор кодируется", () => {
    expect(productsPath({ category: "rolls", limit: 8, cursor: "a-b_c" })).toBe(
      "/products?category=rolls&limit=8&cursor=a-b_c",
    );
    expect(productsPath({ cursor: "a+b/c=" })).toBe("/products?cursor=a%2Bb%2Fc%3D");
  });

  it("пустой или null курсор не отправляется", () => {
    expect(productsPath({ cursor: null })).toBe("/products");
    expect(productsPath({ cursor: "" })).toBe("/products");
  });

  it("размер страницы совпадает со значением по умолчанию в API", () => {
    expect(CATALOG_PAGE_SIZE).toBe(12);
  });
});

describe("relatedProductsPath", () => {
  it("кодирует slug и добавляет лимит", () => {
    expect(relatedProductsPath("a/b", 4)).toBe("/products/a%2Fb/related?limit=4");
    expect(relatedProductsPath("rainbow")).toBe("/products/rainbow/related");
  });
});
