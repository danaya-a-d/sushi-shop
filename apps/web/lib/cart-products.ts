import { type CartState, getCartTotal } from "@/lib/cart";
import type { Product } from "@/types/product";

// Справочник товаров корзины: что API сообщил о товарах, лежащих в корзине. Чистая логика без
// React и сети. Корзина (productId + quantity) и справочник — независимые данные: ответ API
// меняет только справочник и не может потерять или изменить позиции корзины.

export type UnavailableReason = "inactive" | "missing";

export type ProductEntry =
  | {
      kind: "available";
      product: Product;
      /** true — данные получены из API пакетным запросом корзины; false — взяты из карточки при добавлении */
      verified: boolean;
    }
  | { kind: "unavailable"; reason: UnavailableReason };

export type ProductRegistry = {
  entries: Readonly<Record<string, ProductEntry>>;
  /** id, по которым сейчас идёт запрос */
  loading: Readonly<Record<string, true>>;
  /** id, по которым последний запрос завершился ошибкой */
  failed: Readonly<Record<string, true>>;
  /** Номер самого нового запроса, чей ответ уже применён к id: защита от устаревших ответов */
  appliedSeq: Readonly<Record<string, number>>;
};

export const emptyRegistry: ProductRegistry = {
  entries: {},
  loading: {},
  failed: {},
  appliedSeq: {},
};

export type ProductsResult = {
  available: readonly Product[];
  unavailable: readonly string[];
  missing: readonly string[];
};

export type RegistryAction =
  /** Данные карточки товара при добавлении в корзину (ещё не проверены корзиной) */
  | { type: "seed"; product: Product }
  | { type: "request"; ids: readonly string[] }
  | { type: "response"; ids: readonly string[]; seq: number; result: ProductsResult }
  | { type: "failure"; ids: readonly string[] };

function without<T>(record: Readonly<Record<string, T>>, ids: readonly string[]) {
  if (!ids.some((id) => id in record)) return record;
  const copy = { ...record };
  for (const id of ids) delete copy[id];
  return copy;
}

function withTrue(record: Readonly<Record<string, true>>, ids: readonly string[]) {
  return { ...record, ...Object.fromEntries(ids.map((id) => [id, true as const])) };
}

export function registryReducer(
  state: ProductRegistry,
  action: RegistryAction,
): ProductRegistry {
  switch (action.type) {
    case "seed": {
      const existing = state.entries[action.product.id];
      // Уже известные данные (в том числе проверенные API) не затираем данными карточки
      if (existing?.kind === "available") return state;
      return {
        ...state,
        entries: {
          ...state.entries,
          [action.product.id]: { kind: "available", product: action.product, verified: false },
        },
        failed: without(state.failed, [action.product.id]),
      };
    }

    case "request":
      return {
        ...state,
        loading: withTrue(state.loading, action.ids),
        failed: without(state.failed, action.ids),
      };

    case "response": {
      const entries = { ...state.entries };
      const appliedSeq = { ...state.appliedSeq };
      const unanswered: string[] = [];
      const available = new Map(action.result.available.map((product) => [product.id, product]));
      const inactive = new Set(action.result.unavailable);
      const missing = new Set(action.result.missing);

      for (const id of action.ids) {
        // Ответ на более старый запрос не затирает то, что уже применил более новый
        if ((appliedSeq[id] ?? -1) > action.seq) continue;

        const product = available.get(id);
        if (product) {
          entries[id] = { kind: "available", product, verified: true };
        } else if (inactive.has(id)) {
          entries[id] = { kind: "unavailable", reason: "inactive" };
        } else if (missing.has(id)) {
          entries[id] = { kind: "unavailable", reason: "missing" };
        } else {
          // API не упомянул запрошенный id: это нарушение контракта, а не «товар удалён»
          unanswered.push(id);
          continue;
        }
        appliedSeq[id] = action.seq;
      }

      const answered = action.ids.filter((id) => !unanswered.includes(id));
      return {
        entries,
        appliedSeq,
        loading: without(state.loading, action.ids),
        failed: withTrue(without(state.failed, answered), unanswered),
      };
    }

    case "failure":
      return {
        ...state,
        // Уже известные данные остаются на экране, но перестают считаться проверенными
        entries: Object.fromEntries(
          Object.entries(state.entries).map(([id, entry]) => [
            id,
            entry.kind === "available" && action.ids.includes(id)
              ? { ...entry, verified: false }
              : entry,
          ]),
        ),
        loading: without(state.loading, action.ids),
        failed: withTrue(state.failed, action.ids),
      };
  }
}

/** Что известно о позиции корзины. */
export type CartLineView = { productId: string; quantity: number } & (
  | { status: "ok"; product: Product; verified: boolean }
  /** Товар отключён или удалён: позиция остаётся в корзине, пока пользователь её не удалит */
  | { status: "unavailable"; reason: UnavailableReason }
  /** Данных ещё нет, запрос идёт или ещё не начался */
  | { status: "loading" }
  /** Данных нет, потому что запрос не удался */
  | { status: "error" }
);

export function selectLines(cart: CartState, registry: ProductRegistry): CartLineView[] {
  return cart.items.map(({ productId, quantity }): CartLineView => {
    const entry = registry.entries[productId];
    if (entry?.kind === "available") {
      return { productId, quantity, status: "ok", product: entry.product, verified: entry.verified };
    }
    if (entry?.kind === "unavailable") {
      return { productId, quantity, status: "unavailable", reason: entry.reason };
    }
    return { productId, quantity, status: registry.failed[productId] ? "error" : "loading" };
  });
}

/**
 * - restoring — корзина ещё читается из localStorage;
 * - loading   — данные товаров загружаются, перепроверяются или ещё не проверены API;
 * - error     — не удалось получить или проверить данные товаров;
 * - ready     — все позиции проверены API.
 */
export type CartStatus = "restoring" | "loading" | "error" | "ready";

export type CartSummary = {
  status: CartStatus;
  /** Есть отключённые или удалённые товары */
  hasUnavailable: boolean;
  /** Сумма доступных позиций по данным справочника, грн */
  total: number;
  /**
   * true, только когда все позиции проверены API и сейчас ничего не перепроверяется.
   * Итоговой (на которую можно полагаться при оформлении) сумма считается именно тогда.
   */
  totalReliable: boolean;
  /**
   * true, когда о каждой позиции есть данные (пусть и устаревшие, пока идёт перепроверка).
   * Интерфейс показывает сумму по последним известным ценам, чтобы она не мигала.
   */
  totalKnown: boolean;
  /** Оформление разрешено: корзина непуста, всё проверено, недоступных позиций нет */
  canCheckout: boolean;
};

export function selectSummary(
  cart: CartState,
  isReady: boolean,
  lines: readonly CartLineView[],
  registry: ProductRegistry,
): CartSummary {
  const hasUnavailable = lines.some((line) => line.status === "unavailable");
  const total = getCartTotal(cart, (id) => {
    const entry = registry.entries[id];
    return entry?.kind === "available" ? entry.product : undefined;
  });

  let status: CartStatus;
  if (!isReady) status = "restoring";
  else if (lines.some((line) => line.status === "error" || registry.failed[line.productId])) {
    status = "error";
  } else if (
    lines.some(
      (line) =>
        line.status === "loading" ||
        (line.status === "ok" && !line.verified) ||
        // Идёт перепроверка: последняя известная цена остаётся на экране, но считается устаревшей,
        // пока API не ответил. Учитываются только позиции, которые сейчас лежат в корзине.
        registry.loading[line.productId],
    )
  ) {
    status = "loading";
  } else status = "ready";

  return {
    status,
    hasUnavailable,
    total,
    totalReliable: status === "ready",
    totalKnown: isReady && lines.every((line) => line.status === "ok" || line.status === "unavailable"),
    canCheckout: status === "ready" && !hasUnavailable && lines.length > 0,
  };
}
