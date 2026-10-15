import { getProductById } from "@/lib/catalog";
import type { Product } from "@/types/product";

// Чистая логика корзины: без React, localStorage и других браузерных API.

export const MAX_QUANTITY = 99;

/** Позиция корзины: только идентификатор товара и количество. */
export type CartLine = {
  productId: string;
  quantity: number;
};

/** Цена и итог в состоянии не хранятся: они считаются селекторами по каталогу. */
export type CartState = {
  items: readonly CartLine[];
};

export type CartAction =
  | { type: "add"; productId: string }
  | { type: "increment"; productId: string }
  | { type: "decrement"; productId: string }
  | { type: "remove"; productId: string }
  | { type: "clear" }
  | { type: "hydrate"; state: CartState };

export const emptyCart: CartState = { items: [] };

/** Поиск товара по id. Каталог подставляется по умолчанию, в тестах — свой. */
export type ProductLookup = (id: string) => Pick<Product, "id" | "price"> | undefined;

function isKnownProduct(productId: string): boolean {
  return getProductById(productId) !== undefined;
}

function increase(state: CartState, productId: string): CartState {
  if (!isKnownProduct(productId)) return state;

  const line = state.items.find((item) => item.productId === productId);
  if (!line) {
    return { items: [...state.items, { productId, quantity: 1 }] };
  }
  if (line.quantity >= MAX_QUANTITY) return state;

  return {
    items: state.items.map((item) =>
      item.productId === productId
        ? { ...item, quantity: item.quantity + 1 }
        : item,
    ),
  };
}

function decrease(state: CartState, productId: string): CartState {
  const line = state.items.find((item) => item.productId === productId);
  if (!line) return state;

  if (line.quantity <= 1) return remove(state, productId);

  return {
    items: state.items.map((item) =>
      item.productId === productId
        ? { ...item, quantity: item.quantity - 1 }
        : item,
    ),
  };
}

function remove(state: CartState, productId: string): CartState {
  if (!state.items.some((item) => item.productId === productId)) return state;
  return { items: state.items.filter((item) => item.productId !== productId) };
}

/**
 * Если действие ничего не меняет (неизвестный товар, предел количества),
 * возвращается тот же объект состояния: React не будет перерисовываться.
 */
export function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "add":
    case "increment":
      // Повторный add и increment — одно и то же: +1 к существующей позиции
      return increase(state, action.productId);
    case "decrement":
      return decrease(state, action.productId);
    case "remove":
      return remove(state, action.productId);
    case "clear":
      return state.items.length === 0 ? state : emptyCart;
    case "hydrate":
      return action.state;
  }
}

/** Общее количество единиц товаров (сумма количеств по позициям). */
export function getCartCount(state: CartState): number {
  return state.items.reduce((sum, item) => sum + item.quantity, 0);
}

/** Итог по актуальным ценам каталога; товары, которых там нет, не учитываются. */
export function getCartTotal(
  state: CartState,
  lookup: ProductLookup = getProductById,
): number {
  return state.items.reduce((sum, item) => {
    const product = lookup(item.productId);
    return product ? sum + product.price * item.quantity : sum;
  }, 0);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Превращает произвольные данные (например, из localStorage) в безопасное
 * состояние. Ожидаемая форма: { items: [{ productId, quantity }] }.
 * Некорректные записи (в том числе количество вне 1…MAX_QUANTITY) и
 * неизвестные товары отбрасываются, дубликаты суммируются с пределом MAX_QUANTITY. Не бросает ошибок.
 */
export function sanitizeCart(input: unknown): CartState {
  if (!isRecord(input) || !Array.isArray(input.items)) return emptyCart;

  const quantities = new Map<string, number>();

  for (const entry of input.items) {
    if (!isRecord(entry)) continue;

    const { productId, quantity } = entry;
    if (typeof productId !== "string" || !isKnownProduct(productId)) continue;
    if (typeof quantity !== "number" || !Number.isInteger(quantity)) continue;
    if (quantity < 1 || quantity > MAX_QUANTITY) continue;

    const total = (quantities.get(productId) ?? 0) + quantity;
    quantities.set(productId, Math.min(total, MAX_QUANTITY));
  }

  return {
    items: [...quantities].map(([productId, quantity]) => ({
      productId,
      quantity,
    })),
  };
}

/**
 * Объединяет две корзины: количества одинаковых товаров суммируются (не больше
 * MAX_QUANTITY), порядок — сначала `base`, затем новые товары из `extra`.
 * Нужна при восстановлении: сохранённая корзина + то, что пользователь успел
 * добавить до завершения восстановления.
 */
export function mergeCarts(base: CartState, extra: CartState): CartState {
  return sanitizeCart({ items: [...base.items, ...extra.items] });
}
