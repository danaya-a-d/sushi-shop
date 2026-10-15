import { describe, expect, it, vi } from "vitest";
import {
  type CartAction,
  type CartState,
  MAX_QUANTITY,
  cartReducer,
  emptyCart,
  getCartCount,
  getCartTotal,
  mergeCarts,
  sanitizeCart,
} from "@/lib/cart";

// Каталог подменён двумя тестовыми товарами: тесты не зависят от data/products.ts.
// Реальный каталог проверяется отдельно, в cart.catalog.test.ts.
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

const A = "test-a"; // 100 грн
const B = "test-b"; // 250 грн

const cart = (...items: [string, number][]): CartState => ({
  items: items.map(([productId, quantity]) => ({ productId, quantity })),
});

const run = (state: CartState, ...actions: CartAction[]) =>
  actions.reduce(cartReducer, state);

describe("cartReducer", () => {
  it("add: первый товар появляется с количеством 1", () => {
    expect(run(emptyCart, { type: "add", productId: A })).toEqual(cart([A, 1]));
  });

  it("add: повторное добавление увеличивает количество, а не создаёт дубль", () => {
    const state = run(
      emptyCart,
      { type: "add", productId: A },
      { type: "add", productId: A },
    );
    expect(state).toEqual(cart([A, 2]));
  });

  it("add: разные товары сохраняют порядок добавления", () => {
    const state = run(
      emptyCart,
      { type: "add", productId: B },
      { type: "add", productId: A },
    );
    expect(state.items.map((item) => item.productId)).toEqual([B, A]);
  });

  it("increment: увеличивает количество на 1", () => {
    expect(run(cart([A, 2]), { type: "increment", productId: A })).toEqual(
      cart([A, 3]),
    );
  });

  it("decrement: уменьшает количество на 1", () => {
    expect(run(cart([A, 3]), { type: "decrement", productId: A })).toEqual(
      cart([A, 2]),
    );
  });

  it("decrement: при количестве 1 удаляет товар", () => {
    expect(
      run(cart([A, 1], [B, 2]), { type: "decrement", productId: A }),
    ).toEqual(cart([B, 2]));
  });

  it("remove: удаляет позицию целиком", () => {
    expect(
      run(cart([A, 5], [B, 1]), { type: "remove", productId: A }),
    ).toEqual(cart([B, 1]));
  });

  it("clear: очищает корзину", () => {
    expect(run(cart([A, 2], [B, 1]), { type: "clear" })).toEqual(emptyCart);
  });

  it("не превышает MAX_QUANTITY при add и increment", () => {
    const full = cart([A, MAX_QUANTITY]);
    expect(run(full, { type: "add", productId: A })).toEqual(full);
    expect(run(full, { type: "increment", productId: A })).toEqual(full);
  });

  it("неизвестный productId не добавляется и не вызывает ошибку", () => {
    const state = cart([A, 1]);
    const actions: CartAction[] = [
      { type: "add", productId: "unknown" },
      { type: "increment", productId: "unknown" },
      { type: "decrement", productId: "unknown" },
      { type: "remove", productId: "unknown" },
    ];
    for (const action of actions) {
      expect(cartReducer(state, action)).toEqual(state);
    }
  });

  it("не мутирует исходное состояние", () => {
    const state = cart([A, 2]);
    const snapshot = JSON.parse(JSON.stringify(state));

    cartReducer(state, { type: "add", productId: B });
    cartReducer(state, { type: "increment", productId: A });
    cartReducer(state, { type: "decrement", productId: A });
    cartReducer(state, { type: "remove", productId: A });
    cartReducer(state, { type: "clear" });

    expect(state).toEqual(snapshot);
  });

  it("если действие ничего не меняет, возвращает то же состояние (React не перерисуется)", () => {
    const state = cart([A, 1]);
    expect(cartReducer(state, { type: "add", productId: "unknown" })).toBe(state);
    expect(cartReducer(emptyCart, { type: "clear" })).toBe(emptyCart);
  });

  it("increment при MAX_QUANTITY возвращает прежний объект состояния", () => {
    const full = cart([A, MAX_QUANTITY]);
    expect(cartReducer(full, { type: "increment", productId: A })).toBe(full);
  });

  it("remove отсутствующего товара возвращает прежний объект состояния", () => {
    const state = cart([A, 1]);
    expect(cartReducer(state, { type: "remove", productId: B })).toBe(state);
  });

  it("decrement отсутствующего товара не меняет состояние", () => {
    const state = cart([A, 1]);
    expect(cartReducer(state, { type: "decrement", productId: B })).toBe(state);
  });

  it("hydrate: заменяет состояние восстановленным", () => {
    const restored = cart([A, 2], [B, 1]);
    expect(
      run(cart([B, 7]), { type: "hydrate", state: restored }),
    ).toEqual(restored);
  });
});

describe("getCartCount", () => {
  it("пустая корзина — 0", () => {
    expect(getCartCount(emptyCart)).toBe(0);
  });

  it("суммирует единицы товаров, а не число позиций", () => {
    expect(getCartCount(cart([A, 2], [B, 3]))).toBe(5);
  });
});

describe("getCartTotal", () => {
  const prices: Record<string, number> = { a: 100, b: 250 };
  const lookup = (id: string) =>
    id in prices ? { id, price: prices[id] } : undefined;

  it("умножает цену на количество и суммирует позиции", () => {
    expect(getCartTotal(cart(["a", 2], ["b", 3]), lookup)).toBe(2 * 100 + 3 * 250);
  });

  it("пустая корзина — 0", () => {
    expect(getCartTotal(emptyCart, lookup)).toBe(0);
  });

  it("товар, которого нет в каталоге, в сумму не входит и не вызывает ошибку", () => {
    expect(getCartTotal(cart(["a", 1], ["gone", 5]), lookup)).toBe(100);
  });

  it("без lookup берёт цены из каталога (здесь подменён: test-a — 100, test-b — 250)", () => {
    expect(getCartTotal(cart([A, 2], [B, 1]))).toBe(2 * 100 + 250);
  });
});

describe("sanitizeCart", () => {
  it("принимает корректные данные", () => {
    const input = { items: [{ productId: A, quantity: 2 }, { productId: B, quantity: 1 }] };
    expect(sanitizeCart(input)).toEqual(cart([A, 2], [B, 1]));
  });

  it.each([null, undefined, 42, "text", [], {}, { items: "nope" }, { items: null }])(
    "вместо неподходящей формы (%j) возвращает пустую корзину",
    (input) => {
      expect(sanitizeCart(input)).toEqual(emptyCart);
    },
  );

  it("отбрасывает неизвестные товары", () => {
    const input = { items: [{ productId: "unknown", quantity: 1 }, { productId: A, quantity: 1 }] };
    expect(sanitizeCart(input)).toEqual(cart([A, 1]));
  });

  it("отбрасывает записи с недопустимым количеством", () => {
    const bad = [0, -1, 1.5, NaN, Infinity, "2", null, MAX_QUANTITY + 1];
    for (const quantity of bad) {
      expect(sanitizeCart({ items: [{ productId: A, quantity }] })).toEqual(emptyCart);
    }
  });

  it("принимает границы 1 и MAX_QUANTITY", () => {
    const input = { items: [{ productId: A, quantity: 1 }, { productId: B, quantity: MAX_QUANTITY }] };
    expect(sanitizeCart(input)).toEqual(cart([A, 1], [B, MAX_QUANTITY]));
  });

  it("отбрасывает записи неверной формы и сохраняет остальные", () => {
    const input = {
      items: [null, "x", 7, [], { quantity: 1 }, { productId: 1, quantity: 1 }, { productId: B, quantity: 3 }],
    };
    expect(sanitizeCart(input)).toEqual(cart([B, 3]));
  });

  it("объединяет дубликаты, суммируя количество", () => {
    const input = { items: [{ productId: A, quantity: 2 }, { productId: B, quantity: 1 }, { productId: A, quantity: 3 }] };
    expect(sanitizeCart(input)).toEqual(cart([A, 5], [B, 1]));
  });

  it("при объединении дубликатов сохраняет порядок первого появления", () => {
    const input = { items: [{ productId: B, quantity: 1 }, { productId: A, quantity: 1 }, { productId: B, quantity: 2 }] };
    expect(sanitizeCart(input).items.map((item) => item.productId)).toEqual([B, A]);
  });

  it("сумма дубликатов не превышает MAX_QUANTITY", () => {
    const input = { items: [{ productId: A, quantity: 80 }, { productId: A, quantity: 80 }] };
    expect(sanitizeCart(input)).toEqual(cart([A, MAX_QUANTITY]));
  });

  it("лишние поля не попадают в результат", () => {
    const input = { items: [{ productId: A, quantity: 1, price: 1, name: "x" }], total: 999 };
    expect(sanitizeCart(input)).toEqual(cart([A, 1]));
  });

  it("результат пригоден для hydrate", () => {
    const restored = sanitizeCart({ items: [{ productId: A, quantity: 2 }] });
    expect(run(emptyCart, { type: "hydrate", state: restored })).toEqual(cart([A, 2]));
  });
});

describe("mergeCarts", () => {
  it("суммирует количества одинаковых товаров и добавляет новые после базовых", () => {
    expect(mergeCarts(cart([A, 2]), cart([B, 1], [A, 1]))).toEqual(
      cart([A, 3], [B, 1]),
    );
  });

  it("не превышает MAX_QUANTITY", () => {
    expect(mergeCarts(cart([A, 90]), cart([A, 90]))).toEqual(cart([A, MAX_QUANTITY]));
  });

  it("с пустой корзиной возвращает содержимое другой", () => {
    expect(mergeCarts(cart([A, 2]), emptyCart)).toEqual(cart([A, 2]));
    expect(mergeCarts(emptyCart, cart([B, 1]))).toEqual(cart([B, 1]));
  });
});
