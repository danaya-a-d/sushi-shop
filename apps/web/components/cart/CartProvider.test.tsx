// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CartProvider, useCart } from "@/components/cart/CartProvider";
import { CART_STORAGE_KEY } from "@/lib/cart-storage";
import { createFakeCatalog, deferred, makeProduct } from "@/test-utils/fixtures";
import type { ProductsByIds } from "@/lib/api/browser";

/** Выводит состояние корзины текстом и даёт кнопки для действий. */
function Probe({ extra }: { extra?: React.ReactNode }) {
  const cart = useCart();
  return (
    <div>
      <p data-testid="status">{cart.status}</p>
      <p data-testid="ready">{String(cart.isReady)}</p>
      <p data-testid="count">{cart.count}</p>
      <p data-testid="total">{cart.totalReliable ? cart.total : "unreliable"}</p>
      <p data-testid="can-checkout">{String(cart.canCheckout)}</p>
      <p data-testid="known-total">{cart.totalKnown ? cart.total : "unknown"}</p>
      <ul>
        {cart.lines.map((line) => (
          <li key={line.productId} data-testid={`line-${line.productId}`}>
            {line.status}:{line.quantity}
            {line.status === "ok" && `:${line.product.price}:${line.verified ? "verified" : "unverified"}`}
            {line.status === "unavailable" && `:${line.reason}`}
          </li>
        ))}
      </ul>
      <button onClick={() => cart.increment("1")}>inc1</button>
      <button onClick={() => cart.decrement("1")}>dec1</button>
      <button onClick={() => cart.remove("1")}>remove1</button>
      <button onClick={() => cart.add("3", makeProduct("3", { price: 300 }))}>add3-seeded</button>
      <button onClick={() => cart.add("4")}>add4-bare</button>
      <button onClick={() => cart.remove("gone")}>remove-gone</button>
      <button onClick={() => cart.clear()}>clear</button>
      <button onClick={() => cart.refresh()}>refresh</button>
      {extra}
    </div>
  );
}

const stored = (items: { productId: string; quantity: number }[]) =>
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ items }));
const readStored = () => JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? "null");

const text = (id: string) => screen.getByTestId(id).textContent;
const click = (name: string) => userEvent.click(screen.getByRole("button", { name }));
const settle = () => act(async () => {});

let catalog: ReturnType<typeof createFakeCatalog>;

function renderCart(options: { strict?: boolean; fetchProducts?: typeof catalog.fetchProducts } = {}) {
  const tree = (
    <CartProvider fetchProducts={options.fetchProducts ?? catalog.fetchProducts}>
      <Probe />
    </CartProvider>
  );
  return render(options.strict ? <StrictMode>{tree}</StrictMode> : tree);
}

beforeEach(() => {
  localStorage.clear();
  catalog = createFakeCatalog([
    makeProduct("1", { price: 100 }),
    makeProduct("2", { price: 250 }),
    makeProduct("3", { price: 300 }),
    makeProduct("4", { price: 40 }),
  ]);
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("CartProvider: восстановление и загрузка", () => {
  it("пустая корзина не делает запросов к API и сразу готова", async () => {
    renderCart();
    await waitFor(() => expect(text("ready")).toBe("true"));
    await settle();

    expect(catalog.fetchProducts).not.toHaveBeenCalled();
    expect(text("status")).toBe("ready");
    expect(text("can-checkout")).toBe("false");
  });

  it("восстанавливает корзину и грузит все товары одним пакетным запросом", async () => {
    stored([
      { productId: "1", quantity: 2 },
      { productId: "2", quantity: 1 },
    ]);
    renderCart();

    await waitFor(() => expect(text("status")).toBe("ready"));

    expect(catalog.calls).toEqual([["1", "2"]]);
    expect(text("line-1")).toBe("ok:2:100:verified");
    expect(text("line-2")).toBe("ok:1:250:verified");
    expect(text("count")).toBe("3");
    expect(text("total")).toBe("450");
    expect(text("can-checkout")).toBe("true");
  });

  it("пока товары грузятся, позиции «loading», итог ненадёжен, оформление закрыто", async () => {
    const pending = deferred<ProductsByIds>();
    stored([{ productId: "1", quantity: 2 }]);
    renderCart({ fetchProducts: vi.fn(() => pending.promise) });

    await waitFor(() => expect(text("ready")).toBe("true"));
    expect(text("line-1")).toBe("loading:2");
    expect(text("status")).toBe("loading");
    expect(text("total")).toBe("unreliable");
    expect(text("can-checkout")).toBe("false");

    await act(async () => pending.resolve({ available: [makeProduct("1")], unavailable: [], missing: [] }));
    expect(text("status")).toBe("ready");
  });

  it("не меняет сохранённую корзину при загрузке", async () => {
    const items = [
      { productId: "1", quantity: 2 },
      { productId: "2", quantity: 1 },
    ];
    stored(items);
    renderCart();
    await waitFor(() => expect(text("status")).toBe("ready"));
    expect(readStored()).toEqual({ items });
  });
});

describe("CartProvider: изменения корзины", () => {
  it("изменение количества пересчитывает сумму без нового запроса", async () => {
    stored([{ productId: "1", quantity: 1 }]);
    renderCart();
    await waitFor(() => expect(text("status")).toBe("ready"));

    await click("inc1");
    await click("inc1");
    expect(text("total")).toBe("300");
    await click("dec1");
    expect(text("total")).toBe("200");

    expect(catalog.fetchProducts).toHaveBeenCalledTimes(1);
    expect(readStored()).toEqual({ items: [{ productId: "1", quantity: 2 }] });
  });

  it("товар из карточки виден сразу, без запроса, но не разрешает оформление до проверки", async () => {
    renderCart();
    await waitFor(() => expect(text("ready")).toBe("true"));

    await click("add3-seeded");

    expect(text("line-3")).toBe("ok:1:300:unverified");
    expect(catalog.fetchProducts).not.toHaveBeenCalled();
    expect(text("can-checkout")).toBe("false");
    expect(readStored()).toEqual({ items: [{ productId: "3", quantity: 1 }] });
  });

  it("refresh проверяет всю корзину одним запросом и подтверждает данные карточки", async () => {
    stored([{ productId: "1", quantity: 1 }]);
    renderCart();
    await waitFor(() => expect(text("status")).toBe("ready"));
    await click("add3-seeded");
    catalog.fetchProducts.mockClear();

    await click("refresh");
    await waitFor(() => expect(text("line-3")).toBe("ok:1:300:verified"));

    expect(catalog.fetchProducts).toHaveBeenCalledTimes(1);
    expect(catalog.fetchProducts.mock.calls[0][0]).toEqual(["1", "3"]);
    expect(text("can-checkout")).toBe("true");
  });

  it("товар без данных карточки догружается отдельным запросом только по нему", async () => {
    stored([{ productId: "1", quantity: 1 }]);
    renderCart();
    await waitFor(() => expect(text("status")).toBe("ready"));
    catalog.fetchProducts.mockClear();

    await click("add4-bare");

    await waitFor(() => expect(text("line-4")).toBe("ok:1:40:verified"));
    expect(catalog.fetchProducts).toHaveBeenCalledTimes(1);
    expect(catalog.fetchProducts.mock.calls[0][0]).toEqual(["4"]);
  });

  it("повторное нажатие refresh во время идущего запроса не создаёт второй", async () => {
    const pending = deferred<ProductsByIds>();
    stored([{ productId: "1", quantity: 1 }]);
    const fetchProducts = vi.fn(() => pending.promise);
    renderCart({ fetchProducts });
    await waitFor(() => expect(text("ready")).toBe("true"));

    await click("refresh");
    await click("refresh");

    expect(fetchProducts).toHaveBeenCalledTimes(1);
    await act(async () => pending.resolve({ available: [makeProduct("1")], unavailable: [], missing: [] }));
  });

  it("обновляет цену при следующей проверке, не трогая количество", async () => {
    stored([{ productId: "1", quantity: 3 }]);
    renderCart();
    await waitFor(() => expect(text("total")).toBe("300"));

    catalog.setProduct(makeProduct("1", { price: 120 }));
    await click("refresh");

    await waitFor(() => expect(text("total")).toBe("360"));
    expect(text("line-1")).toBe("ok:3:120:verified");
  });
});

describe("CartProvider: ошибки и недоступные товары", () => {
  it("ошибка API: корзина и localStorage сохранены, статус error, оформление закрыто", async () => {
    const items = [{ productId: "1", quantity: 2 }];
    stored(items);
    catalog.failNext();
    renderCart();

    await waitFor(() => expect(text("status")).toBe("error"));

    expect(text("line-1")).toBe("error:2");
    expect(text("count")).toBe("2");
    expect(text("can-checkout")).toBe("false");
    expect(readStored()).toEqual({ items });
  });

  it("после ошибки нет автоматических повторов (нет бесконечного цикла запросов)", async () => {
    stored([{ productId: "1", quantity: 1 }]);
    catalog.failNext(99);
    renderCart();
    await waitFor(() => expect(text("status")).toBe("error"));

    await new Promise((resolve) => setTimeout(resolve, 100));
    await settle();

    expect(catalog.fetchProducts).toHaveBeenCalledTimes(1);
  });

  it("повтор после ошибки загружает данные и разрешает оформление", async () => {
    stored([{ productId: "1", quantity: 2 }]);
    catalog.failNext();
    renderCart();
    await waitFor(() => expect(text("status")).toBe("error"));

    await click("refresh");

    await waitFor(() => expect(text("status")).toBe("ready"));
    expect(text("line-1")).toBe("ok:2:100:verified");
    expect(text("can-checkout")).toBe("true");
    expect(catalog.fetchProducts).toHaveBeenCalledTimes(2);
  });

  it("ошибка перепроверки не стирает показанные данные, но закрывает оформление", async () => {
    stored([{ productId: "1", quantity: 1 }]);
    renderCart();
    await waitFor(() => expect(text("status")).toBe("ready"));

    catalog.failNext();
    await click("refresh");

    await waitFor(() => expect(text("status")).toBe("error"));
    expect(text("line-1")).toBe("ok:1:100:unverified");
    expect(text("can-checkout")).toBe("false");
  });

  it("недоступные и удалённые товары остаются в корзине и в localStorage", async () => {
    const items = [
      { productId: "1", quantity: 1 },
      { productId: "2", quantity: 2 },
      { productId: "gone", quantity: 3 },
    ];
    stored(items);
    catalog.deactivate("2");
    catalog.remove("gone");
    renderCart();

    await waitFor(() => expect(text("line-gone")).toBe("unavailable:3:missing"));

    expect(text("line-1")).toBe("ok:1:100:verified");
    expect(text("line-2")).toBe("unavailable:2:inactive");
    expect(text("total")).toBe("100");
    expect(text("can-checkout")).toBe("false");
    expect(readStored()).toEqual({ items });
  });

  it("после удаления недоступных позиций оформление становится возможным", async () => {
    stored([
      { productId: "1", quantity: 1 },
      { productId: "gone", quantity: 1 },
    ]);
    catalog.remove("gone");
    renderCart();
    await waitFor(() => expect(text("line-gone")).toBe("unavailable:1:missing"));
    expect(text("can-checkout")).toBe("false");

    await click("remove-gone");

    expect(screen.queryByTestId("line-gone")).not.toBeInTheDocument();
    expect(text("can-checkout")).toBe("true");
    expect(readStored()).toEqual({ items: [{ productId: "1", quantity: 1 }] });
  });
});

describe("CartProvider: гонки и Strict Mode", () => {
  it("Strict Mode: количество не удваивается, запрос один", async () => {
    stored([
      { productId: "1", quantity: 2 },
      { productId: "2", quantity: 1 },
    ]);
    renderCart({ strict: true });

    await waitFor(() => expect(text("status")).toBe("ready"));

    expect(text("count")).toBe("3");
    expect(text("line-1")).toBe("ok:2:100:verified");
    expect(catalog.fetchProducts).toHaveBeenCalledTimes(1);
    expect(readStored()).toEqual({
      items: [
        { productId: "1", quantity: 2 },
        { productId: "2", quantity: 1 },
      ],
    });
  });

  it("ответ API на запрос про уже удалённую позицию не возвращает её и не портит корзину", async () => {
    const pending = deferred<ProductsByIds>();
    stored([
      { productId: "1", quantity: 2 },
      { productId: "2", quantity: 1 },
    ]);
    renderCart({ fetchProducts: vi.fn(() => pending.promise) });
    await waitFor(() => expect(text("ready")).toBe("true"));

    await click("remove1"); // пользователь удалил позицию, пока ответ не пришёл
    await act(async () =>
      pending.resolve({
        available: [makeProduct("1", { price: 100 }), makeProduct("2", { price: 250 })],
        unavailable: [],
        missing: [],
      }),
    );

    expect(screen.queryByTestId("line-1")).not.toBeInTheDocument();
    expect(text("line-2")).toBe("ok:1:250:verified");
    expect(readStored()).toEqual({ items: [{ productId: "2", quantity: 1 }] });
  });

  it("ответ после очистки корзины не воскрешает позиции", async () => {
    const pending = deferred<ProductsByIds>();
    stored([{ productId: "1", quantity: 2 }]);
    renderCart({ fetchProducts: vi.fn(() => pending.promise) });
    await waitFor(() => expect(text("ready")).toBe("true"));

    await click("clear");
    await act(async () => pending.resolve({ available: [makeProduct("1")], unavailable: [], missing: [] }));

    expect(text("count")).toBe("0");
    expect(readStored()).toEqual({ items: [] });
  });

  it("товар, добавленный до окончания восстановления, объединяется с сохранённым без потерь", async () => {
    stored([{ productId: "1", quantity: 2 }]);
    renderCart();
    // добавление сразу после монтирования, в тот же тик, что и восстановление
    await click("add3-seeded");
    await waitFor(() => expect(text("line-1")).toBe("ok:2:100:verified"));

    expect(text("count")).toBe("3");
    expect(readStored()).toEqual({
      items: [
        { productId: "1", quantity: 2 },
        { productId: "3", quantity: 1 },
      ],
    });
  });
});

describe("CartProvider: перепроверка цен (refresh)", () => {
  /** Запросы, начатые после startGating(), ждут, пока тест не ответит на них вручную. */
  function gatedFetch() {
    const gates: ReturnType<typeof deferred<ProductsByIds>>[] = [];
    let gated = false;
    const fetchProducts = vi.fn(async (ids: readonly string[]) => {
      if (!gated) return catalog.fetchProducts(ids);
      const gate = deferred<ProductsByIds>();
      gates.push(gate);
      return gate.promise;
    });
    return { fetchProducts, gates, startGating: () => void (gated = true) };
  }

  const answer = (...products: ReturnType<typeof makeProduct>[]): ProductsByIds => ({
    available: products,
    unavailable: [],
    missing: [],
  });

  it("ready → loading → ready: цена видна, оформление закрыто, затем снова открыто", async () => {
    stored([{ productId: "1", quantity: 2 }]);
    const api = gatedFetch();
    renderCart({ fetchProducts: api.fetchProducts });
    await waitFor(() => expect(text("status")).toBe("ready"));
    expect(text("can-checkout")).toBe("true");

    api.startGating();
    await click("refresh");

    expect(text("status")).toBe("loading");
    expect(text("can-checkout")).toBe("false");
    expect(text("total")).toBe("unreliable");
    // последняя известная цена остаётся на экране
    expect(text("line-1")).toBe("ok:2:100:verified");
    expect(text("known-total")).toBe("200");

    await act(async () => api.gates[0].resolve(answer(makeProduct("1", { price: 100 }))));
    expect(text("status")).toBe("ready");
    expect(text("can-checkout")).toBe("true");
    expect(text("total")).toBe("200");
  });

  it("ready → loading → error: корзина и localStorage целы, оформление закрыто, повтор помогает", async () => {
    const items = [{ productId: "1", quantity: 2 }];
    stored(items);
    const api = gatedFetch();
    renderCart({ fetchProducts: api.fetchProducts });
    await waitFor(() => expect(text("status")).toBe("ready"));

    api.startGating();
    await click("refresh");
    expect(text("can-checkout")).toBe("false");
    await act(async () => api.gates[0].reject(new Error("API недоступен")));

    expect(text("status")).toBe("error");
    expect(text("can-checkout")).toBe("false");
    expect(text("line-1")).toBe("ok:2:100:unverified");
    expect(readStored()).toEqual({ items });

    await click("refresh");
    expect(text("status")).toBe("loading");
    await act(async () => api.gates[1].resolve(answer(makeProduct("1"))));
    expect(text("status")).toBe("ready");
    expect(text("can-checkout")).toBe("true");
  });

  it("цена изменилась, ответ пришёл с задержкой: до ответа оформление закрыто, после — новая цена", async () => {
    stored([{ productId: "1", quantity: 1 }]);
    const api = gatedFetch();
    renderCart({ fetchProducts: api.fetchProducts });
    await waitFor(() => expect(text("status")).toBe("ready"));

    api.startGating();
    await click("refresh");
    expect(text("line-1")).toBe("ok:1:100:verified"); // старая цена
    expect(text("can-checkout")).toBe("false");

    await act(async () => api.gates[0].resolve(answer(makeProduct("1", { price: 150 }))));
    expect(text("line-1")).toBe("ok:1:150:verified");
    expect(text("total")).toBe("150");
    expect(text("can-checkout")).toBe("true");
  });

  it("повторные refresh() во время запроса не создают новых запросов", async () => {
    stored([{ productId: "1", quantity: 1 }]);
    const api = gatedFetch();
    renderCart({ fetchProducts: api.fetchProducts });
    await waitFor(() => expect(text("status")).toBe("ready"));

    api.startGating();
    await click("refresh");
    await click("refresh");
    await click("refresh");

    expect(api.gates).toHaveLength(1);
    await act(async () => api.gates[0].resolve(answer(makeProduct("1"))));
  });

  it("изменение количества во время и после перепроверки не вызывает запросов", async () => {
    stored([{ productId: "1", quantity: 1 }]);
    const api = gatedFetch();
    renderCart({ fetchProducts: api.fetchProducts });
    await waitFor(() => expect(text("status")).toBe("ready"));

    api.startGating();
    await click("refresh");
    await click("inc1");
    await click("inc1");
    await click("dec1");
    await act(async () => api.gates[0].resolve(answer(makeProduct("1"))));
    await click("inc1");

    expect(api.gates).toHaveLength(1);
    expect(text("count")).toBe("3");
    expect(text("status")).toBe("ready");
  });

  it("корзину очистили во время запроса: ответ её не возвращает, localStorage пуст", async () => {
    stored([{ productId: "1", quantity: 2 }]);
    const api = gatedFetch();
    renderCart({ fetchProducts: api.fetchProducts });
    await waitFor(() => expect(text("status")).toBe("ready"));

    api.startGating();
    await click("refresh");
    await click("clear");
    expect(text("can-checkout")).toBe("false");

    await act(async () => api.gates[0].resolve(answer(makeProduct("1"))));

    expect(text("count")).toBe("0");
    expect(screen.queryByTestId("line-1")).not.toBeInTheDocument();
    expect(text("can-checkout")).toBe("false");
    expect(readStored()).toEqual({ items: [] });
  });

  it("товар удалён из корзины, пока API отвечает: ответ не возвращает его, остальное проверяется", async () => {
    stored([
      { productId: "1", quantity: 1 },
      { productId: "2", quantity: 1 },
    ]);
    const api = gatedFetch();
    renderCart({ fetchProducts: api.fetchProducts });
    await waitFor(() => expect(text("status")).toBe("ready"));

    api.startGating();
    await click("refresh");
    await click("remove1");
    // позиция 2 всё ещё перепроверяется тем же запросом, поэтому оформление закрыто
    expect(text("can-checkout")).toBe("false");

    await act(async () =>
      api.gates[0].resolve(answer(makeProduct("1"), makeProduct("2", { price: 250 }))),
    );

    expect(screen.queryByTestId("line-1")).not.toBeInTheDocument();
    expect(text("line-2")).toBe("ok:1:250:verified");
    expect(text("status")).toBe("ready");
    expect(text("can-checkout")).toBe("true");
    expect(readStored()).toEqual({ items: [{ productId: "2", quantity: 1 }] });
  });

  it("товар добавлен во время перепроверки: догружается отдельным запросом, оформление ждёт оба", async () => {
    stored([{ productId: "1", quantity: 1 }]);
    const api = gatedFetch();
    renderCart({ fetchProducts: api.fetchProducts });
    await waitFor(() => expect(text("status")).toBe("ready"));

    api.startGating();
    await click("refresh");
    await click("add4-bare");
    await waitFor(() => expect(api.gates).toHaveLength(2));

    await act(async () => api.gates[0].resolve(answer(makeProduct("1"))));
    expect(text("can-checkout")).toBe("false"); // товар 4 ещё не проверен

    await act(async () => api.gates[1].resolve(answer(makeProduct("4", { price: 40 }))));
    expect(text("can-checkout")).toBe("true");
    expect(text("total")).toBe("1290"); // 1250 (дефолтная цена makeProduct) + 40
  });

  it("Strict Mode: восстановление не дублирует запросы", async () => {
    stored([{ productId: "1", quantity: 2 }]);
    const api = gatedFetch();
    renderCart({ strict: true, fetchProducts: api.fetchProducts });
    await waitFor(() => expect(text("status")).toBe("ready"));
    expect(api.fetchProducts).toHaveBeenCalledTimes(1);
    expect(text("count")).toBe("2");
  });
});

describe("CartProvider: товары с любой страницы каталога", () => {
  it("демо-товары из дальних страниц добавляются и восстанавливаются запросом по id, независимо от страницы", async () => {
    const demo = makeProduct("demo-33", { price: 190 });
    catalog.setProduct(demo);
    catalog.setProduct(makeProduct("demo-40", { price: 1000 }));
    stored([
      { productId: "demo-33", quantity: 2 },
      { productId: "demo-40", quantity: 1 },
    ]);
    renderCart();

    await waitFor(() => expect(text("status")).toBe("ready"));

    // один запрос по id, без обращения к страницам каталога
    expect(catalog.calls).toEqual([["demo-33", "demo-40"]]);
    expect(text("line-demo-33")).toBe("ok:2:190:verified");
    expect(text("total")).toBe("1380");
  });

  it("товар с дальней страницы, добавленный из карточки, считается сразу и проверяется при открытии корзины", async () => {
    renderCart();
    await waitFor(() => expect(text("ready")).toBe("true"));

    await click("add3-seeded");
    expect(text("known-total")).toBe("300");
    expect(text("can-checkout")).toBe("false"); // ещё не проверен API

    await click("refresh");
    await waitFor(() => expect(text("can-checkout")).toBe("true"));
  });
});
