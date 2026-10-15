import { describe, expect, it } from "vitest";
import { getCartTotal, sanitizeCart } from "@/lib/cart";
import { getProducts } from "@/lib/catalog";

// Интеграционная проверка с настоящим каталогом (без подмены): не зависит
// от конкретных id и цен, только от согласованности корзины и каталога.
describe("корзина и настоящий каталог", () => {
  const products = getProducts();

  it("sanitizeCart принимает каждый товар каталога", () => {
    const items = products.map((product) => ({ productId: product.id, quantity: 1 }));
    expect(sanitizeCart({ items }).items).toHaveLength(products.length);
  });

  it("getCartTotal считает по ценам каталога", () => {
    const state = sanitizeCart({
      items: products.map((product) => ({ productId: product.id, quantity: 2 })),
    });
    const expected = products.reduce((sum, product) => sum + product.price * 2, 0);
    expect(getCartTotal(state)).toBe(expected);
  });
});
