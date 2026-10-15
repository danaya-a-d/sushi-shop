import { describe, expect, it, vi } from "vitest";
import { emptyCart } from "@/lib/cart";
import { CART_STORAGE_KEY, type CartStorage, loadCart, saveCart } from "@/lib/cart-storage";

vi.mock("@/lib/catalog", () => {
  const testProducts = [
    { id: "test-a", price: 100 },
    { id: "test-b", price: 250 },
  ];
  return {
    getProductById: (id: string) =>
      testProducts.find((product) => product.id === id),
  };
});

/** Простое хранилище в памяти вместо localStorage. */
function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  const storage: CartStorage = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
  };
  return { storage, data };
}

const withCart = (value: unknown) =>
  fakeStorage({ [CART_STORAGE_KEY]: JSON.stringify(value) }).storage;

describe("loadCart", () => {
  it("нет сохранённых данных — пустая корзина", () => {
    expect(loadCart(fakeStorage().storage)).toEqual(emptyCart);
  });

  it("восстанавливает сохранённую корзину", () => {
    const storage = withCart({ items: [{ productId: "test-a", quantity: 2 }] });
    expect(loadCart(storage)).toEqual({ items: [{ productId: "test-a", quantity: 2 }] });
  });

  it("повреждённый JSON — пустая корзина, без исключения", () => {
    const { storage } = fakeStorage({ [CART_STORAGE_KEY]: "{not json" });
    expect(loadCart(storage)).toEqual(emptyCart);
  });

  it.each([null, 42, "text", [], { items: "nope" }])(
    "повреждённая структура (%j) — пустая корзина",
    (value) => {
      expect(loadCart(withCart(value))).toEqual(emptyCart);
    },
  );

  it("отбрасывает неизвестные товары и неверное количество (через sanitizeCart)", () => {
    const storage = withCart({
      items: [
        { productId: "gone", quantity: 1 },
        { productId: "test-a", quantity: 0 },
        { productId: "test-b", quantity: 3 },
      ],
    });
    expect(loadCart(storage)).toEqual({ items: [{ productId: "test-b", quantity: 3 }] });
  });

  it("ошибка чтения — пустая корзина", () => {
    const storage: CartStorage = {
      getItem: () => {
        throw new Error("доступ запрещён");
      },
      setItem: () => {},
    };
    expect(loadCart(storage)).toEqual(emptyCart);
  });

  it("хранилища нет (сервер, запрет доступа) — пустая корзина", () => {
    expect(loadCart(null)).toEqual(emptyCart);
    // В окружении node нет window: вызов без аргументов тоже безопасен
    expect(loadCart()).toEqual(emptyCart);
  });
});

describe("saveCart", () => {
  it("сохраняет под ключом версии только productId и quantity", () => {
    const { storage, data } = fakeStorage();
    // Лишние поля (цена, название) в хранилище попадать не должны
    const state = {
      items: [{ productId: "test-a", quantity: 2, price: 100, name: "x" }],
    };

    expect(saveCart(state, storage)).toBe(true);
    expect(CART_STORAGE_KEY).toBe("sushi-shop:cart:v1");
    expect(JSON.parse(data.get(CART_STORAGE_KEY)!)).toEqual({
      items: [{ productId: "test-a", quantity: 2 }],
    });
  });

  it("сохранённое можно восстановить обратно", () => {
    const { storage } = fakeStorage();
    const state = { items: [{ productId: "test-a", quantity: 2 }, { productId: "test-b", quantity: 1 }] };
    saveCart(state, storage);
    expect(loadCart(storage)).toEqual(state);
  });

  it("ошибка записи (например, переполнено) — false, без исключения", () => {
    const storage: CartStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    };
    expect(saveCart({ items: [] }, storage)).toBe(false);
  });

  it("хранилища нет — false", () => {
    expect(saveCart({ items: [] }, null)).toBe(false);
    expect(saveCart({ items: [] })).toBe(false);
  });
});
