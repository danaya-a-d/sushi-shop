import { describe, expect, it } from "vitest";
import { type CartState, emptyCart } from "@/lib/cart";
import {
  type ProductRegistry,
  type RegistryAction,
  emptyRegistry,
  registryReducer,
  selectLines,
  selectSummary,
} from "@/lib/cart-products";
import { makeProduct } from "@/test-utils/fixtures";

const run = (state: ProductRegistry, ...actions: RegistryAction[]) =>
  actions.reduce(registryReducer, state);

const cart = (...items: [string, number][]): CartState => ({
  items: items.map(([productId, quantity]) => ({ productId, quantity })),
});

const A = makeProduct("a", { price: 100 });
const B = makeProduct("b", { price: 250 });

const answer = (available = [] as typeof A[], unavailable: string[] = [], missing: string[] = []) => ({
  available,
  unavailable,
  missing,
});

const summary = (c: CartState, registry: ProductRegistry, isReady = true) =>
  selectSummary(c, isReady, selectLines(c, registry), registry);

describe("registryReducer", () => {
  it("response: доступные товары попадают в справочник как проверенные", () => {
    const state = run(emptyRegistry, { type: "response", ids: ["a"], seq: 1, result: answer([A]) });
    expect(state.entries.a).toEqual({ kind: "available", product: A, verified: true });
  });

  it("response различает отключённые и отсутствующие товары", () => {
    const state = run(emptyRegistry, {
      type: "response",
      ids: ["a", "b"],
      seq: 1,
      result: answer([], ["a"], ["b"]),
    });
    expect(state.entries.a).toEqual({ kind: "unavailable", reason: "inactive" });
    expect(state.entries.b).toEqual({ kind: "unavailable", reason: "missing" });
  });

  it("request помечает загрузку, response и failure её снимают", () => {
    const loading = run(emptyRegistry, { type: "request", ids: ["a"] });
    expect(loading.loading.a).toBe(true);
    expect(run(loading, { type: "response", ids: ["a"], seq: 1, result: answer([A]) }).loading).toEqual({});
    expect(run(loading, { type: "failure", ids: ["a"] }).loading).toEqual({});
  });

  it("failure помечает id как ошибочные, а повторный request снимает отметку", () => {
    const failed = run(emptyRegistry, { type: "failure", ids: ["a"] });
    expect(failed.failed.a).toBe(true);
    expect(run(failed, { type: "request", ids: ["a"] }).failed).toEqual({});
  });

  it("failure не стирает известные данные, но перестаёт считать их проверенными", () => {
    const state = run(
      emptyRegistry,
      { type: "response", ids: ["a"], seq: 1, result: answer([A]) },
      { type: "failure", ids: ["a"] },
    );
    expect(state.entries.a).toEqual({ kind: "available", product: A, verified: false });
  });

  it("устаревший ответ не затирает данные более нового запроса", () => {
    const fresh = makeProduct("a", { price: 200 });
    const state = run(
      emptyRegistry,
      { type: "response", ids: ["a"], seq: 2, result: answer([fresh]) },
      { type: "response", ids: ["a"], seq: 1, result: answer([A]) }, // пришёл позже, но запрос был раньше
    );
    expect(state.entries.a).toMatchObject({ product: { price: 200 } });
  });

  it("более новый ответ заменяет цену", () => {
    const updated = makeProduct("a", { price: 150 });
    const state = run(
      emptyRegistry,
      { type: "response", ids: ["a"], seq: 1, result: answer([A]) },
      { type: "response", ids: ["a"], seq: 2, result: answer([updated]) },
    );
    expect(state.entries.a).toMatchObject({ product: { price: 150 } });
  });

  it("id, пропущенный в ответе, считается ошибкой, а не «товар удалён»", () => {
    const state = run(emptyRegistry, { type: "response", ids: ["a", "b"], seq: 1, result: answer([A]) });
    expect(state.entries.b).toBeUndefined();
    expect(state.failed.b).toBe(true);
    expect(state.failed.a).toBeUndefined();
  });

  it("seed добавляет данные карточки как непроверенные и не затирает уже известные", () => {
    const seeded = run(emptyRegistry, { type: "seed", product: A });
    expect(seeded.entries.a).toEqual({ kind: "available", product: A, verified: false });

    const verified = run(emptyRegistry, { type: "response", ids: ["a"], seq: 1, result: answer([A]) });
    const stale = makeProduct("a", { price: 1 });
    expect(run(verified, { type: "seed", product: stale })).toBe(verified);
  });
});

describe("selectLines / selectSummary", () => {
  it("пока справочник пуст, позиции «загружаются», а не «недоступны»", () => {
    const c = cart(["a", 1]);
    expect(selectLines(c, emptyRegistry)[0].status).toBe("loading");
    const s = summary(c, emptyRegistry);
    expect(s.status).toBe("loading");
    expect(s.canCheckout).toBe(false);
    expect(s.totalReliable).toBe(false);
  });

  it("до восстановления корзины статус restoring", () => {
    expect(summary(emptyCart, emptyRegistry, false).status).toBe("restoring");
  });

  it("всё проверено: ready, сумма по актуальным ценам, оформление разрешено", () => {
    const registry = run(emptyRegistry, {
      type: "response",
      ids: ["a", "b"],
      seq: 1,
      result: answer([A, B]),
    });
    const s = summary(cart(["a", 2], ["b", 1]), registry);
    expect(s).toMatchObject({ status: "ready", total: 450, totalReliable: true, canCheckout: true });
  });

  it("недоступная позиция остаётся в списке, не входит в сумму и блокирует оформление", () => {
    const registry = run(emptyRegistry, {
      type: "response",
      ids: ["a", "b"],
      seq: 1,
      result: answer([A], [], ["b"]),
    });
    const c = cart(["a", 1], ["b", 3]);
    const lines = selectLines(c, registry);
    expect(lines.map((l) => l.status)).toEqual(["ok", "unavailable"]);
    expect(lines[1]).toMatchObject({ quantity: 3, reason: "missing" });
    const s = summary(c, registry);
    expect(s).toMatchObject({ hasUnavailable: true, total: 100, canCheckout: false });
  });

  it("ошибка загрузки: позиция в статусе error, оформление запрещено", () => {
    const registry = run(emptyRegistry, { type: "failure", ids: ["a"] });
    const c = cart(["a", 1]);
    expect(selectLines(c, registry)[0].status).toBe("error");
    expect(summary(c, registry)).toMatchObject({ status: "error", canCheckout: false });
  });

  it("ошибка перепроверки: старые данные видны, но статус error и оформление запрещено", () => {
    const registry = run(
      emptyRegistry,
      { type: "response", ids: ["a"], seq: 1, result: answer([A]) },
      { type: "failure", ids: ["a"] },
    );
    const c = cart(["a", 1]);
    expect(selectLines(c, registry)[0].status).toBe("ok");
    expect(summary(c, registry)).toMatchObject({ status: "error", canCheckout: false });
  });

  it("товар из карточки без проверки не разрешает оформление", () => {
    const registry = run(emptyRegistry, { type: "seed", product: A });
    const s = summary(cart(["a", 1]), registry);
    expect(s.status).toBe("loading");
    expect(s.canCheckout).toBe(false);
  });

  it("пустая корзина оформлять нельзя", () => {
    expect(summary(emptyCart, emptyRegistry).canCheckout).toBe(false);
  });

  it("перепроверка: последняя цена остаётся видимой, но оформление закрыто, пока идёт запрос", () => {
    const c = cart(["a", 2]);
    const verified = run(emptyRegistry, { type: "response", ids: ["a"], seq: 1, result: answer([A]) });
    expect(summary(c, verified)).toMatchObject({ status: "ready", canCheckout: true, totalReliable: true });

    const rechecking = run(verified, { type: "request", ids: ["a"] });
    expect(selectLines(c, rechecking)[0]).toMatchObject({ status: "ok", product: A });
    expect(summary(c, rechecking)).toMatchObject({
      status: "loading",
      canCheckout: false,
      totalReliable: false,
      totalKnown: true,
      total: 200,
    });
  });

  it("ready → loading → ready: после ответа оформление снова разрешено, цена обновлена", () => {
    const c = cart(["a", 1]);
    const state = run(
      emptyRegistry,
      { type: "response", ids: ["a"], seq: 1, result: answer([A]) },
      { type: "request", ids: ["a"] },
      { type: "response", ids: ["a"], seq: 2, result: answer([makeProduct("a", { price: 120 })]) },
    );
    expect(summary(c, state)).toMatchObject({ status: "ready", canCheckout: true, total: 120 });
  });

  it("ready → loading → error: данные остаются, оформление закрыто", () => {
    const c = cart(["a", 1]);
    const state = run(
      emptyRegistry,
      { type: "response", ids: ["a"], seq: 1, result: answer([A]) },
      { type: "request", ids: ["a"] },
      { type: "failure", ids: ["a"] },
    );
    expect(selectLines(c, state)[0]).toMatchObject({ status: "ok" });
    expect(summary(c, state)).toMatchObject({ status: "error", canCheckout: false, totalKnown: true });
  });

  it("перепроверка товара, которого нет в корзине, оформление не блокирует", () => {
    const state = run(
      emptyRegistry,
      { type: "response", ids: ["a", "b"], seq: 1, result: answer([A, B]) },
      { type: "request", ids: ["b"] }, // b уже удалён из корзины, а ответ ещё не пришёл
    );
    expect(summary(cart(["a", 1]), state)).toMatchObject({ status: "ready", canCheckout: true });
  });

  it("пока данных нет совсем, сумма неизвестна", () => {
    expect(summary(cart(["a", 1]), emptyRegistry).totalKnown).toBe(false);
  });
});
